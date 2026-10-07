const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { jsonrepair } = require('jsonrepair');
const logger = require('../../utils/logger');

// Load medications database for lookup
let medicationsDb = [];
try {
  const dbPath = path.join(__dirname, '../../../database/medications-db.json');
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  medicationsDb = JSON.parse(rawData).medications || [];
  logger.info(`[Scan Service] Loaded ${medicationsDb.length} medications from database.`);
} catch (err) {
  logger.warn('[Scan Service] Could not load medications-db.json: ' + err.message);
}

/**
 * Tra cứu thông tin chi tiết thuốc từ database medications-db.json
 * @param {string} name - Tên thuốc cần tra cứu
 * @returns {object|null} - Thông tin thuốc hoặc null nếu không tìm thấy
 */
function findMedicationInDatabase(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  const exact = medicationsDb.find(med =>
    med.name.toLowerCase() === lower ||
    (med.aliases || []).some(alias => alias.toLowerCase() === lower)
  );
  if (exact) return exact;
  // So khớp mờ từng từ (vd "Glimpirid 2mg" -> glimepiride) thay cho .includes() cũ - cách cũ
  // khớp nhầm khi 1 tên là chuỗi con của tên khác và bỏ sót tên bị AI đọc méo 1-2 ký tự.
  const hit = fuzzyMatchDrug(name);
  return hit ? hit.med : null;
}

// Danh sách tên thuốc dùng chung với ai_ocr/medical_matcher.py
const DRUG_NAMES = require('../../../database/drug-names.json');
const DIABETES_KEYWORDS = DRUG_NAMES.diabetes;

function isDiabetesDrug(name) {
  const lower = (name || '').toLowerCase().trim();
  return DIABETES_KEYWORDS.some(k => lower.includes(k));
}

function isDiabetesDiagnosis(diagnosis) {
  const lower = (diagnosis || '').toLowerCase().trim();
  return lower.includes('đái tháo đường') ||
         lower.includes('tiểu đường') ||
         /\bđtđ\b/.test(lower) ||
         lower.includes('diabetes') ||
         lower.includes('sugar');
}

// Khoảng cách chỉnh sửa Levenshtein quy về độ tương đồng 0..1.
function levenshteinRatio(a, b) {
  if (!a.length || !b.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

// Hoạt chất thông dụng ngoài ĐTĐ - chỉ làm "mỏ neo" để so khớp mờ không kéo nhầm thuốc khác về
// 1 thuốc ĐTĐ gần giống (vd Rosuvastatin -> Atorvastatin). Không đánh dấu `verified`.
const COMMON_DRUGS = DRUG_NAMES.common;

const DB_TERMS = medicationsDb.flatMap(med =>
  [med.name, ...(med.aliases || [])].map(term => ({ term: term.toLowerCase(), med })));
// Thuốc ĐTĐ được ưu tiên: DB nội bộ trước, rồi danh sách biệt dược/hoạt chất ĐTĐ, cuối cùng thuốc phổ thông.
const DRUG_TERMS = [...DB_TERMS, ...[...DIABETES_KEYWORDS, ...COMMON_DRUGS]
  .filter(k => !DB_TERMS.some(t => t.term === k))
  .map(term => ({ term, med: null }))];

/**
 * Tìm tên thuốc gần đúng nhất (độ tương đồng >= 70%) cho tên AI đọc từ chữ viết tay.
 * Trả về null khi không đủ giống hoặc mơ hồ giữa 2 thuốc khác nhau (vd Glipizide/Gliclazide)
 * - đoán sai tên thuốc nguy hiểm hơn để nguyên cho người dùng tự kiểm tra.
 * @returns {{term: string, word: string, score: number, med: object|null}|null} med = bản ghi DB nếu có
 */
function fuzzyMatchDrug(name) {
  const lower = (name || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = lower.split(' ').filter(w => w.length >= 4);
  const scored = DRUG_TERMS.map(t => {
    // Tên nhiều từ (vd "jardiance duo") so với cả cụm, tên 1 từ so với từng từ.
    const candidates = t.term.includes(' ') ? [lower] : words;
    let hit = { ...t, word: null, score: 0 };
    for (const word of candidates) {
      const score = levenshteinRatio(word, t.term);
      if (score > hit.score) hit = { ...t, word, score };
    }
    return hit;
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 0.7) return null;
  const sameDrug = t => t.term === best.term || (t.med && t.med === best.med);
  const runnerUp = scored.find(t => !sameDrug(t));
  if (best.score < 1 && runnerUp && best.score - runnerUp.score < 0.1) return null;
  return best;
}

function getPrompt(lang = 'vi') {
  const languageNames = {
    'en': 'English',
    'lo': 'Lao',
    'vi': 'Vietnamese'
  };
  const targetLang = languageNames[lang] || 'Vietnamese';

  return `You are an expert medical assistant. Analyze the medical prescription (either from the image directly or from the OCR text provided) and convert it into a structured JSON object.
All string values returned MUST be directly translated into ${targetLang}. They must be direct, short, and contain no filler words.
If isDiabetesPrescription is false, you should still attempt to parse the medications in the prescription.

CRITICAL INSTRUCTIONS:
- A valid medical prescription MUST contain a list of prescribed medications (drugs with names and dosages/frequencies).
- You MUST extract ALL medications found in the prescription without exception. If there are 7 medications, return 7. Do NOT truncate, do NOT summarize, and do NOT skip ANY medication under any circumstances.
- You MUST explicitly search for and extract the Doctor's name (doctorName), the Prescription Date (prescriptionDate), the Next Appointment Date (nextAppointmentDate), and any Doctor's Notes/Instructions (doctorNotes). These are very important.
- doctorNotes = the printed "Lời dặn" section PLUS all handwritten notes on the paper (not only the printed line).
- Extract any patient health metrics (e.g. Glucose, HbA1c, Blood Pressure, Weight, Height) present in the document into the "metrics" array. Do NOT parse diagnostic parameters as medications.
- If the document is a laboratory test result, diagnostic imaging report, referral letter, or if the text is unreadable, set "isPrescription" to false.

READING DOCTOR HANDWRITING - TWO-STEP CLINICAL REASONING (most prescriptions are hurried cursive):
STEP A - Clinical context first (top-down): before decoding the scribbles, read the PRINTED and clearly legible parts: diagnosis / ICD code (e.g. "E11" = type 2 diabetes, "I10" = hypertension), patient age, lab values, and printed drugs. From these, form a short list of drugs that are plausible for this patient under standard treatment guidelines (Vietnam Ministry of Health / ADA), e.g. E11 -> metformin (Glucophage), sulfonylureas, DPP-4, SGLT2, insulin (premixed 30/70, basal); hypertension -> ACE-inhibitor/ARB/CCB.
STEP B - Match the strokes (bottom-up): for each handwritten line, compare its visible features - first and last letters, word length, ascenders/descenders, and distinctive numbers (e.g. "30/70", "28", "500") - against that plausible list, and pick the drug that fits BOTH the strokes and the clinical context.
HARD LIMITS on the clinical context: it only helps choose between readings the strokes allow. NEVER add a drug that has no handwritten or printed line on the paper, never replace a clearly written drug with a "more typical" one, and if there is no diagnosis on the paper do not assume diabetes. Each medication you return must correspond to one visible line.
NEVER INVENT DOSES: if the strength, amount per dose, frequency or time of a drug is NOT written on the paper, set "dosage"/"amountPerDose"/"timesPerDay" to null, "times" to [] and say "Chưa ghi liều - hỏi lại bác sĩ/dược sĩ" in "instructions". Do not fill in the usual dose of that drug (e.g. do not write "850mg, 2 lần/ngày" for a Glucophage line that has no dose). A wrong dose is dangerous; an empty one is safe.
A number that is part of a brand name and has no unit next to it (e.g. "Coveram 5-5", "Lipanthyl 200M") is NOT a strength in mg: keep it in "name" and only fill "dosage" when a unit (mg, g, ml, IU, đv) is written.

1. Layout: the hospital/clinic name is usually printed at the top. Each drug is one numbered line "<Drug> <strength>  SL: <quantity>", and the usage line written BELOW (or after a dash on the same line) belongs to that drug. Never merge two drugs or move a usage line to another drug. English prescriptions use "<Drug> <strength> mg - <instruction>".
2. Vietnamese medical shorthand:
   - "v" = viên, "g" = gói, "ố"/"ống" = ống, "lọ", "bút" = bút tiêm, "đv"/"U"/"UI"/"IU" = đơn vị (insulin), "SL" = số lượng, "l/ng" = lần/ngày.
   - "1v x 2" or "1v x 2l/ng" = 1 viên x 2 lần/ngày. "s" / "Sá" / "Sán" = sáng, "tr" = trưa, "c" / "Ch" = chiều, "t" = tối. "s - c" = sáng 1 lần, chiều 1 lần.
   - After a number, a hurried "đv" often looks like "dr", "dv", "đr" or "d" with a tail: "12 dr" = 12 đơn vị (IU). This is the insulin unit, never a drug name.
   - A line "Sáng 18 đv / Chiều 12 đv" under an insulin = the morning dose and the afternoon dose of THAT insulin (different doses per time of day): put both in "instructions" and "amountPerDose" (e.g. "Sáng 18 đơn vị, chiều 12 đơn vị") and set times ["07:00","15:00"].
   - "u.s.a" = uống sau ăn, "u.t.a" or "t.a" = uống trước ăn, "u.t.n" = uống trước khi đi ngủ, "30p" = 30 phút.
   - "TDD" = tiêm dưới da, "TB" = tiêm bắp, "TM" = tiêm tĩnh mạch.
3. Ambiguous characters - resolve with context (a drug strength must be a plausible, commercially available strength):
   - "1" vs "l" vs "I": a stroke next to digits or "mg"/"v"/"x" is the digit 1.
   - "0" vs "O", "5" vs "S", "2" vs "Z", "7" vs "1" (cursive 1 often has a long lead-in stroke and looks like 7): inside a number they are digits.
   - Decimal points are tiny and easy to miss: "0.5mg"/"0,5mg" must NOT become "5mg". Glimepiride 1mg/2mg/4mg, Gliclazide MR 30mg/60mg, Metformin 500/750/850/1000mg are real strengths - prefer the reading that is a real strength.
   - Insulin "U" written after a number looks like "0": "10U" is 10 units, NOT 100. Insulin is dosed in units (IU), never in mg; a single dose above 50 units is almost always a misreading.
4. Drug names: a hurried scribble is still a real drug. Decode it to the closest real drug name that is consistent with the strength and the diagnosis (e.g. "Glimpirid" -> Glimepiride, "Glicazid" -> Gliclazide, "Metfornin" -> Metformin). Keep the brand name if a brand is written (e.g. "Diamicron MR"), never invent a drug that is not on the paper.
5. Diabetes context (DIA+ users are diabetes patients - check these brands first): Glucophage/Panfor/Glumeform = metformin; Diamicron MR = gliclazide; Amaryl = glimepiride; Daonil = glibenclamide; Januvia = sitagliptin; Galvus = vildagliptin; Trajenta = linagliptin; Jardiance = empagliflozin; Forxiga = dapagliflozin; NovoNorm = repaglinide; Glucobay = acarbose; Actos = pioglitazone; Lantus/Toujeo = insulin glargine; Levemir = insulin detemir; NovoMix 30 = insulin aspart 30/70; Mixtard 30 = human insulin 30/70; NovoRapid/Humalog = rapid insulin; Ozempic/Rybelsus = semaglutide; Trulicity = dulaglutide.
6. Worked examples (what the scribble looks like -> correct decoding):
   - "Trajenta 5mg  SL: 28v / 1v s u.t.a 30p" -> name "Trajenta", dosage "5mg", quantity "28 viên", amountPerDose "1 viên", timesPerDay 1, instructions "Uống 1 viên buổi sáng, trước ăn 30 phút", times ["07:00"].
   - "Galvus Met 50/1000mg  SL: 56v / 1v x 2l/ng s-c u.s.a" -> dosage "50/1000mg", quantity "56 viên", timesPerDay 2, instructions "Uống 1 viên x 2 lần/ngày, sáng - chiều, sau ăn", times ["07:00","15:00"].
   - "Levemir FlexPen  SL: 1 bút / TDD 8U t 22h" -> name "Levemir FlexPen", dosage "8 IU" (8 đơn vị - NOT 80), quantity "1 bút tiêm", instructions "Tiêm dưới da 8 đơn vị buổi tối lúc 22h", times ["22:00"].
   - "Naproxen 250 mg - As needed for pain" -> dosage "250mg", instructions "Uống khi cần (khi đau)". "Every 8 hours" -> "Uống mỗi 8 giờ", times ["06:00","14:00","22:00"]; "Every 12 hours" -> "Uống mỗi 12 giờ", times ["07:00","19:00"]; "At bedtime" -> "Uống trước khi đi ngủ"; "With food" -> "Uống cùng bữa ăn"; "Take twice daily" -> "Uống 2 lần/ngày"; "Take once daily" -> "Uống 1 lần/ngày"; "As directed" -> "Dùng theo chỉ dẫn của bác sĩ".
7. "instructions" must keep EVERY usage detail written by the doctor: frequency (x lần/ngày, mỗi x giờ), time of day, relation to meals (trước/sau/cùng bữa ăn), route (uống/tiêm dưới da), and "khi cần" if present. Translate, never drop or summarise them.

JSON Schema:
{
  "isPrescription": true/false (true if the image/text represents a medical prescription),
  "isDiabetesPrescription": true/false (true if the diagnosis, symptoms, or any of the medications are for diabetes),
  "isLabReport": true/false (true if the document is a laboratory test result / phiếu kết quả xét nghiệm),
  "hospitalName": "Name of the hospital/clinic on the document" or null,
  "labCondition": "good" or "severe" (Evaluate the metrics: if Glucose, HbA1c, Cholesterol, etc. are significantly high or abnormal, output "severe", else "good"),
  "rejectionReason": "Detailed reason in ${targetLang} why this is not a prescription or not related to diabetes" or null,
  "doctorName": "Doctor name" or null,
  "prescriptionDate": "Prescription date in YYYY-MM-DD format" or null,
  "nextAppointmentDate": "Next appointment date in YYYY-MM-DD format" or null,
  "diagnosis": "Detailed diagnosis in ${targetLang}" or null,
  "doctorNotes": "EVERYTHING the doctor wrote as advice/notes in ${targetLang}: the printed 'Lời dặn' text AND every handwritten line under or around it (handwritten notes are often the most important part), transcribed in reading order and joined with '; '. Example: 'Mang đơn này đi khám lần sau; Mua: Insulin 30/70 tiêm sáng 18 đơn vị, chiều 12 đơn vị; Glucophage'. Handwritten drug lines must ALSO appear in medications. Do not drop a handwritten line just because it is hard to read - transcribe your best reading" or null,
  "medications": [{
    "name": "Drug name only, as written on the prescription after decoding (e.g. Metformin, Diamicron MR, Lantus)",
    "dosage": "Strength per tablet with its unit, exactly as written (e.g. 500mg, 0.5mg). For insulin: units per injection (e.g. 12 IU)",
    "quantity": "Total quantity prescribed (e.g. 30 tablets)" or null,
    "amountPerDose": "Amount per dose (e.g. 1 tablet)",
    "timesPerDay": times_per_day_number,
    "frequency": "Frequency description (e.g. 2 times/day)",
    "times": ["HH:MM"] (Map time keywords to HH:MM format. Sáng->07:00, Trưa->12:00, Chiều->15:00, Tối->19:00, Trước ngủ/Tối muộn->22:00. Adjust based on instructions),
    "hasDoctorTime": true/false (true if prescription explicitly mentions time of day like sáng, trưa, tối, sau ăn, trước ăn, specific hours. false if not specified),
    "durationDays": 28 (Integer number of days to take this medicine if specified like '28 ngày', '14 ngày', else null),
    "instructions": "Full usage instructions in ${targetLang}",
    "route": "Route of administration in Vietnamese: 'uống' (tablets, capsules, sachets, syrup), 'tiêm dưới da' (insulin, GLP-1 pens like Ozempic/Trulicity/Victoza), 'tiêm bắp', 'tiêm tĩnh mạch', 'bôi', 'nhỏ', 'xịt'",
    "isDiabetesDrug": true/false (true if this medication is specifically for diabetes/lowering blood glucose/insulin),
    "detail": {
      "purpose": "Brief drug purpose in ${targetLang}, phrased as a general educational summary. Do NOT invent or cite a specific publication/source.",
      "mechanism": "Brief mechanism of action in ${targetLang}, phrased as a general educational summary. Do NOT invent or cite a specific publication/source.",
      "source": "AI_GENERATED"
    }
  }],
  "metrics": [{
    "measurement_type": "Must be one of: 'glucose_fasting', 'glucose_tolerance', 'hba1c', 'c_peptide', 'blood_pressure'",
    "value": 120 (Numeric value. For blood pressure, put systolic here),
    "value_diastolic": 80 (Numeric value for diastolic blood pressure, or null for other metrics)
  }]
}`;
}

// ============================================================================
// CẢNH BÁO LỆCH LIỀU BẤT THƯỜNG (Dosage Sanity Check):
// AI đọc chữ viết tay có thể nhầm lẫn con số (vd "0.5mg" -> "5mg", sai lệch 10 lần - đủ để
// gây quá liều nguy hiểm). Đây KHÔNG phải kiểm định lâm sàng chính xác (không phân biệt được
// "liều/1 lần uống" so với "tổng liều/ngày" của đơn nhiều cữ) - chỉ là 1 phép kiểm tra thô,
// biên rất rộng, để bắt được các trường hợp lệch số RÕ RÀNG bất thường (vd lệch >20 lần),
// nhắc người dùng tự đối chiếu lại với đơn gốc trước khi lưu - không tự khẳng định đúng/sai.
// ============================================================================
function parseDosageRange(text) {
  const m = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*mg/i.exec(text || '');
  if (!m) return null;
  return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
}

function parseDosageValue(text) {
  const m = /(\d+(?:\.\d+)?)\s*mg/i.exec(text || '');
  return m ? parseFloat(m[1]) : null;
}

function checkDosageSanity(aiDosageText, dbMatch) {
  if (!dbMatch || !dbMatch.dosage) return null;
  const range = parseDosageRange(dbMatch.dosage);
  const value = parseDosageValue(aiDosageText);
  if (!range || value == null) return null;

  // Biên rất rộng (chia 20 / nhân 2) để tránh báo nhầm do khác nhau giữa liều/1 lần uống và
  // tổng liều/ngày (đơn thường chia 1-3 lần/ngày) - chỉ báo khi lệch xa bất thường.
  const lowBound = range.min / 20;
  const highBound = range.max * 2;
  if (value < lowBound || value > highBound) {
    return `Số liều "${aiDosageText}" có vẻ khác thường so với khoảng thường gặp của ${dbMatch.name} (${dbMatch.dosage}). Vui lòng đối chiếu lại với đơn thuốc gốc trước khi lưu.`;
  }
  return null;
}

// Insulin luôn tính bằng đơn vị (IU). Hai lỗi đọc chữ viết tay nguy hiểm tính mạng:
// "10U" bị đọc thành "100" (chữ U giống số 0) và ghi nhầm đơn vị mg.
function checkInsulinDose(m, dbMatch) {
  const isInsulin = (dbMatch && dbMatch.category === 'Insulin') || /insulin|\b(iu|ui|đv|đơn vị)\b/i.test(`${m.name} ${m.dosage}`);
  if (!isInsulin) return null;
  if (/\d\s*mg/i.test(m.dosage || '')) {
    return `Insulin được kê theo ĐƠN VỊ (IU), không phải mg. Liều "${m.dosage}" có thể đọc sai - vui lòng đối chiếu đơn gốc.`;
  }
  if (/\/\s*ml/i.test(m.dosage || '')) {
    return `"${m.dosage}" là nồng độ của lọ/bút insulin, không phải liều tiêm. Vui lòng nhập số đơn vị mỗi lần tiêm theo đơn gốc.`;
  }
  const units = /(\d+(?:[.,]\d+)?)\s*(iu|ui|u|đv|đơn vị|units?)?/i.exec(m.dosage || '');
  // ponytail: ngưỡng thô 50 IU/lần, không xét cân nặng/loại insulin - chỉ để bắt lỗi "U" -> "0".
  if (units && parseFloat(units[1].replace(',', '.')) > 50) {
    return `Liều insulin ${units[1]} đơn vị/lần cao bất thường - kiểm tra chữ "U" có bị đọc thành số 0 không (vd 10U -> 100). Vui lòng đối chiếu đơn gốc.`;
  }
  return null;
}

// Đường dùng khi AI không trả: insulin / GLP-1 / chữ "tiêm" -> tiêm dưới da, còn lại -> uống.
const INJECTABLE = /insulin|lantus|levemir|toujeo|tresiba|mixtard|novomix|novorapid|humalog|humulin|apidra|ozempic|trulicity|victoza|saxenda|byetta|mounjaro|liraglutide|semaglutide|dulaglutide|exenatide|tirzepatide/i;
function guessRoute(m, dbMatch) {
  const text = `${m.name} ${m.instructions || ''} ${m.dosage || ''}`;
  if ((dbMatch && /Insulin|GLP-1/.test(dbMatch.category)) || INJECTABLE.test(text) || /tiêm|\b(iu|ui|đv)\b/i.test(text)) return 'tiêm dưới da';
  return 'uống';
}

// Tên AI đọc méo (vd "Glimpirid") -> sửa về tên đúng gần nhất, giữ tên gốc AI đọc ở nameAsRead.
function normalizeDrugName(name) {
  const hit = fuzzyMatchDrug(name);
  if (!hit || hit.score === 1) return name;
  const canonical = hit.term.replace(/\b\w/g, c => c.toUpperCase());
  return name.replace(new RegExp(hit.word, 'i'), canonical);
}

function shapeResult(parsed) {
  const rawMedications = parsed.medications || [];

  // Đối chiếu từng thuốc AI đọc được với DB nội bộ đã kiểm định (medications-db.json):
  const medications = rawMedications.map(raw => {
    const name = normalizeDrugName(raw.name);
    let m = name === raw.name ? raw : { ...raw, name, nameAsRead: raw.name };
    // AI tự nhận đơn không ghi liều nhưng vẫn điền liều "thường gặp" (đo được: Glucophage -> 850mg) -> xoá,
    // vì liều bịa nguy hiểm hơn ô trống bắt người dùng hỏi lại.
    if (/chưa ghi liều/i.test(m.instructions || '')) {
      m = { ...m, dosage: null, amountPerDose: null, timesPerDay: null, times: [] };
    }
    const dbMatch = findMedicationInDatabase(m.name);
    const combinedText = `${m.instructions || ''} ${m.frequency || ''} ${m.dosage || ''}`;

    // Nếu AI chưa trả hasDoctorTime, tự động kiểm tra regex các từ khóa
    const hasDoctorTime = (m.hasDoctorTime !== undefined && m.hasDoctorTime !== null)
      ? Boolean(m.hasDoctorTime)
      : Boolean(combinedText.match(/sáng|trưa|chiều|tối|trước ăn|sau ăn|ngủ|buổi|\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b/i));

    // Tự động bóc tách số ngày uống từ instructions hoặc frequency bằng regex
    let durationDays = (typeof m.durationDays === 'number' && !isNaN(m.durationDays)) ? m.durationDays : null;
    if (!durationDays) {
      const dMatch = combinedText.match(/(?:uống|dùng|trong)?\s*:?\s*(\d+)\s*(?:ngày|day)/i);
      if (dMatch && dMatch[1]) durationDays = parseInt(dMatch[1], 10);
    }

    return {
      ...m,
      route: m.route || guessRoute(m, dbMatch),
      hasDoctorTime,
      durationDays,
      verified: !!dbMatch,
      dosageWarning: checkInsulinDose(m, dbMatch) || checkDosageSanity(m.dosage, dbMatch),
      detail: {
        ...(m.detail || {}),
        source: dbMatch ? (dbMatch.source || 'Cơ sở dữ liệu thuốc nội bộ DIA+') : 'AI_GENERATED',
      },
    };
  });

  const isPrescription = parsed.isPrescription !== false && medications.length > 0;
  const isLabReport = parsed.isLabReport === true;
  const hospitalName = parsed.hospitalName || 'bệnh viện';
  const labCondition = parsed.labCondition || 'good';

  let labReportAdvice = null;
  if (isLabReport) {
    if (labCondition === 'severe') {
      labReportAdvice = `Vui lòng liên hệ ${hospitalName} để được Bác sĩ tư vấn chi tiết về kết quả xét nghiệm này nhé.`;
    } else {
      labReportAdvice = "Tình trạng của bạn khá tốt. Nếu cần uống thuốc, vui lòng cung cấp thêm đơn thuốc bác sĩ yêu cầu.";
    }
  }

  const keywordDiabetes = medications.some(m => isDiabetesDrug(m.name));
  const isDiabetesPrescription = isPrescription && (
    parsed.isDiabetesPrescription === true ||
    isDiabetesDiagnosis(parsed.diagnosis) ||
    keywordDiabetes ||
    true // Trích xuất đầy đủ tất cả thuốc trong đơn khám bệnh
  );

  const diabetesDrugs = medications
    .filter(m => m.isDiabetesDrug === true || isDiabetesDrug(m.name))
    .map(m => m.name);

  return {
    isPrescription,
    isDiabetesPrescription,
    isLabReport,
    labReportAdvice,
    hospitalName,
    rejectionReason: (!isPrescription && !isLabReport)
      ? (parsed.rejectionReason || 'Không tìm thấy thông tin thuốc được kê trong tài liệu này (ví dụ: đây là kết quả xét nghiệm hoặc ảnh chụp quá mờ).')
      : (parsed.rejectionReason || null),
    medications: isPrescription ? medications : [],
    hasDiabetesDrugs: diabetesDrugs.length > 0,
    diabetesDrugs,
    doctorName: parsed.doctorName || parsed.doctor_name || null,
    prescriptionDate: parsed.prescriptionDate || parsed.prescription_date || parsed.date || null,
    nextAppointmentDate: parsed.nextAppointmentDate || parsed.next_appointment_date || parsed.follow_up_date || null,
    diagnosis: parsed.diagnosis || null,
    doctorNotes: parsed.doctorNotes || parsed.doctor_notes || parsed.notes || null,
    metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
    error: parsed.error || null,
  };
}

function parseAiJson(text) {
  let cleaned = text.trim();

  // Tìm cặp dấu ngoặc {} đầu tiên và cuối cùng (loại bỏ text giải thích thừa quanh JSON)
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    logger.warn('First JSON parse failed. Attempting to repair via jsonrepair...');
  }

  try {
    return JSON.parse(jsonrepair(cleaned));
  } catch (repairError) {
    logger.error('JSON Repair failed. Raw text from AI: ' + text, repairError);
    throw repairError;
  }
}

// ============================================================================
// TrOCR (src/ai_ocr/trocr_engine.py) - model chuyên đọc chữ viết tay theo dòng, chạy Python cục bộ.
// Bật bằng TROCR_ENABLED=1 (cần venv src/ai_ocr/.venv, xem src/ai_ocr/README.md). Mặc định TẮT:
// model ~1.3GB + PyTorch không chạy nổi trên gói Render hiện tại.
// SCAN_ENGINE: 'ensemble' (mặc định khi bật TrOCR: chữ TrOCR làm gợi ý cho Gemini; đo được giúp giảm bịa tên thuốc) | 'trocr' (chỉ TrOCR, để đo).
// ponytail: mỗi lần quét spawn 1 tiến trình Python và nạp lại model (~10s) - production thì chạy
// trocr_engine thành service thường trú.
// ============================================================================
const { execFile } = require('child_process');
const os = require('os');
const AI_OCR_DIR = path.join(__dirname, '../../ai_ocr');
const TROCR_PYTHON = path.join(AI_OCR_DIR, '.venv/bin/python');

function trocrEnabled() {
  return process.env.TROCR_ENABLED === '1' && fs.existsSync(TROCR_PYTHON);
}

async function runTrocr(imageBuffer, mimeType) {
  if (!trocrEnabled()) return null;
  const ext = /png/.test(mimeType || '') ? '.png' : '.jpg';
  const tmp = path.join(os.tmpdir(), `diaplus-trocr-${process.pid}-${Date.now()}${ext}`);
  fs.writeFileSync(tmp, imageBuffer);
  try {
    const stdout = await new Promise((resolve, reject) => {
      execFile(TROCR_PYTHON, ['trocr_engine.py', tmp], { cwd: AI_OCR_DIR, timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
        (err, out) => (err ? reject(err) : resolve(out)));
    });
    const result = JSON.parse(stdout.trim().split('\n').pop());
    if (result.error) throw new Error(result.error);
    logger.info(`[TrOCR] Đọc ${result.lines.length} dòng trong ${result.seconds}s`);
    return result;
  } catch (err) {
    logger.error('[TrOCR] Lỗi: ' + err.message);
    return null;
  } finally {
    fs.unlink(tmp, () => {});
  }
}

// Gợi ý cho Gemini: chữ TrOCR đọc (đã sửa tên thuốc) - ảnh vẫn là nguồn sự thật.
function trocrHint(trocr) {
  if (!trocr || !trocr.lines.length) return '';
  return `

HANDWRITING OCR HINT: a separate handwriting-recognition model (TrOCR, trained on English handwriting, so Vietnamese diacritics are lost) read the image line by line, top to bottom:
---
${trocr.lines.map(l => l.corrected).join('\n')}
---
Use these lines only as hints to disambiguate hard-to-read strokes (drug names, digits). The IMAGE is the source of truth: if the image clearly shows something different, follow the image.`;
}

// Using LLM (Gemini/Claude) with direct image/multimodal input for best accuracy and speed.
// Tesseract OCR is kept as a robust fallback.
// Mỗi model chỉ được chờ ngần này: model quá tải có thể treo hơn 3 phút rồi mới báo 503
// (đo được 07/10 với gemini-flash-latest) -> cả lượt quét vượt 300s, Render trả 502, app không nhận kết quả.
const MODEL_TIMEOUT_MS = 25000;
// Hết ngân sách thì thôi thử tiếp và bỏ qua Tesseract (rất chậm trên Render free), báo lỗi để người dùng thử lại.
const SCAN_BUDGET_MS = 100000;

async function analyzePrescription(imageBuffer, mimeType, lang = 'vi') {
  const startedAt = Date.now();
  const overBudget = () => Date.now() - startedAt > SCAN_BUDGET_MS;
  if (!imageBuffer) {
    throw new Error('Không nhận được dữ liệu hình ảnh.');
  }
  const trocr = await runTrocr(imageBuffer, mimeType);
  if (trocr && process.env.SCAN_ENGINE === 'trocr') {
    return shapeResult({ medications: trocr.medications.map(m => ({ ...m, times: [] })) });
  }
  const dynamicPrompt = getPrompt(lang) + trocrHint(trocr);

  const imageBase64 = imageBuffer.toString('base64');
  let directText = '';

  // 1. ƯU TIÊN HÀNG ĐẦU: Gửi hình ảnh trực tiếp (Multimodal Vision AI) cho Gemini
  // Giúp giảm thời gian từ >30 giây xuống chỉ còn 1.5 - 2.5 giây!
  if (process.env.GEMINI_API_KEY) {
    // Thứ tự theo đo thực tế 07/10: 2.5-flash đọc chữ tay tốt, flash-lite-latest nhanh (~5s) và hầu như
    // luôn trả lời; flash-latest hay quá tải nên để sau. Quota free-tier tính RIÊNG từng model, nhiều model
    // = còn chỗ lùi khi 1 model bị 429/503. Mỗi model tối đa MODEL_TIMEOUT_MS.
    const rawCandidates = [
      'gemini-2.5-flash',
      'gemini-flash-lite-latest',
      process.env.GEMINI_MODEL,
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash'
    ].filter(Boolean);
    const candidateModels = [...new Set(rawCandidates)];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of candidateModels) {
      if (overBudget()) break;
      try {
        logger.info(`[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Google Gemini Vision (${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        }, { timeout: MODEL_TIMEOUT_MS });

        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        };

        const result = await model.generateContent([
          dynamicPrompt,
          imagePart
        ]);
        directText = result.response.text();

        if (directText) {
          const parsed = parseAiJson(directText);
          const shaped = shapeResult(parsed);
          logger.info(`[Quét đơn thuốc] Phân tích ảnh bằng Gemini Vision (${modelName}) thành công siêu tốc!`);
          return shaped;
        }
      } catch (geminiError) {
        logger.error(`[Quét đơn thuốc] Lỗi Gemini Vision (${modelName}): ` + geminiError.message);
      }
    }
  }

  // 2. FALLBACK 1: Gửi hình ảnh trực tiếp cho Anthropic Claude
  if (!directText && process.env.ANTHROPIC_API_KEY && !overBudget()) {
    try {
      logger.info("[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Anthropic Claude...");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: dynamicPrompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });
      directText = response.content[0].text;
      if (directText) {
        const parsed = parseAiJson(directText);
        const shaped = shapeResult(parsed);
        logger.info("[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Claude thành công!");
        return shaped;
      }
    } catch (claudeError) {
      logger.error("[Quét đơn thuốc] Lỗi Claude Vision trực tiếp: " + claudeError.message);
    }
  }

  // 2b. FALLBACK: các AI Vision đều lỗi nhưng TrOCR đã đọc được thuốc -> trả kết quả TrOCR.
  if (trocr && trocr.medications.length) {
    logger.info('[Quét đơn thuốc] AI Vision lỗi - dùng kết quả TrOCR');
    return shapeResult({ medications: trocr.medications.map(m => ({ ...m, times: [] })) });
  }

  if (overBudget()) {
    logger.error(`[Quét đơn thuốc] Hết thời gian (${Math.round((Date.now() - startedAt) / 1000)}s) - các AI đều quá tải/lỗi`);
    throw new Error('Máy chủ AI đang quá tải, chưa đọc được đơn. Vui lòng thử lại sau ít phút.');
  }

  // 3. FALLBACK 2: Trích xuất chữ bằng Tesseract OCR nếu các AI Vision đều không hoạt động
  logger.info("[Quét đơn thuốc] Kích hoạt Fallback - Trích xuất chữ bằng Tesseract OCR...");
  const tessdataDir = path.join(__dirname, '../../../database/tessdata');
  if (!fs.existsSync(tessdataDir)) {
    fs.mkdirSync(tessdataDir, { recursive: true });
  }

  let ocrText = '';
  try {
    // Tesseract không có timeout riêng - giới hạn trong phần ngân sách còn lại.
    const remaining = Math.max(SCAN_BUDGET_MS - (Date.now() - startedAt), 1000);
    const ocrResult = await Promise.race([Tesseract.recognize(
      imageBuffer,
      'vie+eng',
      {
        cachePath: tessdataDir,
        logger: m => {
          if (m.status === 'recognizing text' && Math.round(m.progress * 100) % 25 === 0) {
            logger.info(`[Tesseract OCR] Tiến trình: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    ), new Promise((_, reject) => setTimeout(() => reject(new Error(`Tesseract quá ${Math.round(remaining / 1000)}s`)), remaining))]);
    ocrText = ocrResult.data.text || '';
    logger.info(`[Quét đơn thuốc] Trích xuất Tesseract hoàn tất. Độ dài: ${ocrText.length} ký tự.`);
  } catch (ocrError) {
    logger.error("[Quét đơn thuốc] Lỗi Tesseract OCR: " + ocrError.message);
  }

  if (ocrText && ocrText.trim().length > 0) {
    const promptWithOcr = `${dynamicPrompt}

Dữ liệu chữ trích xuất từ Tesseract OCR cần phân tích và sắp xếp thành cấu trúc JSON:
---
${ocrText}
---`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 }
        }, { timeout: MODEL_TIMEOUT_MS });
        const result = await model.generateContent([promptWithOcr]);
        const text = result.response.text();
        if (text) {
          const parsed = parseAiJson(text);
          return shapeResult(parsed);
        }
      } catch (err) {
        logger.error("[Quét đơn thuốc] Lỗi Gemini OCR Text: " + err.message);
      }
    }

    // MỚI: trước đây fallback cuối cùng chỉ thử Gemini - nếu server chỉ cấu hình
    // ANTHROPIC_API_KEY (không có Gemini) thì văn bản OCR trích xuất được không bao giờ
    // được gửi đi cấu trúc hoá, dù Claude vẫn khả dụng. Thêm nhánh Claude cho đúng văn bản
    // OCR để chuỗi fallback thực sự đầy đủ Gemini -> Claude -> Tesseract -> Gemini/Claude text.
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        logger.info("[Quét đơn thuốc] Phân tích văn bản OCR bằng Anthropic Claude...");
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4000,
          messages: [{ role: 'user', content: promptWithOcr }]
        });
        const text = response.content[0].text;
        if (text) {
          const parsed = parseAiJson(text);
          return shapeResult(parsed);
        }
      } catch (err) {
        logger.error("[Quét đơn thuốc] Lỗi Claude OCR Text: " + err.message);
      }
    }
  }

  // 4. Nếu tất cả đều thất bại
  throw new Error('Vui lòng cấu hình GEMINI_API_KEY hoặc ANTHROPIC_API_KEY và đảm bảo kết nối mạng ổn định.');
}

module.exports = { analyzePrescription, shapeResult, parseAiJson, isDiabetesDrug, findMedicationInDatabase };
