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

  return medicationsDb.find(med => {
    // Match by primary name
    if (med.name.toLowerCase() === lower) return true;
    // Match by aliases
    if (med.aliases && med.aliases.some(alias => alias.toLowerCase() === lower)) return true;
    // Partial match - medication name contains search term or vice versa
    if (med.name.toLowerCase().includes(lower) || lower.includes(med.name.toLowerCase())) return true;
    if (med.aliases && med.aliases.some(alias =>
      alias.toLowerCase().includes(lower) || lower.includes(alias.toLowerCase())
    )) return true;
    return false;
  }) || null;
}

const DIABETES_KEYWORDS = [
  'metformin', 'glucophage', 'diamet', 'tiaphage', 'gluformin', 'glucofast',
  'glibenclamide', 'daonil', 'maninil', 'glibenhexal',
  'gliclazide', 'diamicron', 'predian',
  'glimepiride', 'amaryl', 'glimet', 'glimpi', 'glimestar',
  'glipizide', 'minidiab',
  'insulin', 'mixtard', 'lantus', 'novomix', 'novorapid', 'humulin', 'humalog', 'levemir',
  'sitagliptin', 'januvia',
  'vildagliptin', 'galvus',
  'saxagliptin', 'onglyza',
  'linagliptin', 'trajenta',
  'alogliptin', 'nesina',
  'empagliflozin', 'jardiance',
  'dapagliflozin', 'forxiga',
  'canagliflozin', 'invokana',
  'pioglitazone', 'actos',
  'acarbose', 'glucobay',
  'liraglutide', 'victoza',
  'semaglutide', 'ozempic',
  'dulaglutide', 'trulicity',
  'exenatide', 'byetta',
  // Added common brand names & combination drugs in Vietnam:
  'janumet', 'glucovance', 'xigduo', 'synjardy', 'glyxambi', 'eucreas',
  'vildarpin', 'sitagil', 'glimaryl', 'glimerax', 'panfor', 'meglucon',
  'siofor', 'gliclada', 'tirzepatide', 'mounjaro', 'rybelsus', 'jardiance duo',
  // Added: nhóm meglitinide và alpha-glucosidase còn thiếu trong danh sách gốc
  'repaglinide', 'novonorm', 'nateglinide', 'starlix', 'voglibose', 'basen', 'tofogliflozin'
];

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
- Extract any patient health metrics (e.g. Glucose, HbA1c, Blood Pressure, Weight, Height) present in the document into the "metrics" array. Do NOT parse diagnostic parameters as medications.
- If the document is a laboratory test result, diagnostic imaging report, referral letter, or if the text is unreadable, set "isPrescription" to false.

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
  "doctorNotes": "Doctor instructions/notes in ${targetLang}" or null,
  "medications": [{
    "name": "Drug name only (e.g. Metformin, Galvus Met)",
    "dosage": "Dosage (e.g. 500mg, 1000mg)",
    "quantity": "Total quantity prescribed (e.g. 30 tablets)" or null,
    "amountPerDose": "Amount per dose (e.g. 1 tablet)",
    "timesPerDay": times_per_day_number,
    "frequency": "Frequency description (e.g. 2 times/day)",
    "times": ["HH:MM"] (Map time keywords to HH:MM format. Sáng->07:00, Trưa->12:00, Chiều->15:00, Tối->19:00, Trước ngủ/Tối muộn->22:00. Adjust based on instructions),
    "hasDoctorTime": true/false (true if prescription explicitly mentions time of day like sáng, trưa, tối, sau ăn, trước ăn, specific hours. false if not specified),
    "durationDays": 28 (Integer number of days to take this medicine if specified like '28 ngày', '14 ngày', else null),
    "instructions": "Full usage instructions in ${targetLang}",
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

function shapeResult(parsed) {
  const rawMedications = parsed.medications || [];

  // Đối chiếu từng thuốc AI đọc được với DB nội bộ đã kiểm định (medications-db.json):
  const medications = rawMedications.map(m => {
    const dbMatch = findMedicationInDatabase(m.name);
    const instr = m.instructions || m.frequency || '';
    const hasDoctorTime = m.hasDoctorTime !== undefined 
      ? Boolean(m.hasDoctorTime) 
      : Boolean((m.times && m.times.length > 0) && instr.match(/sáng|trưa|chiều|tối|trước ăn|sau ăn|ngủ|buổi|\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b/i));

    let durationDays = m.durationDays || null;
    if (!durationDays) {
      const dMatch = instr.match(/(?:uống|dùng|trong)?\s*:?\s*(\d+)\s*(?:ngày|day)/i);
      if (dMatch && dMatch[1]) durationDays = parseInt(dMatch[1], 10);
    }

    return {
      ...m,
      hasDoctorTime,
      durationDays,
      verified: !!dbMatch,
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

// Using LLM (Gemini/Claude) with direct image/multimodal input for best accuracy and speed.
// Tesseract OCR is kept as a robust fallback.
async function analyzePrescription(imageBuffer, mimeType, lang = 'vi') {
  const dynamicPrompt = getPrompt(lang);
  if (!imageBuffer) {
    throw new Error('Không nhận được dữ liệu hình ảnh.');
  }

  const imageBase64 = imageBuffer.toString('base64');
  let directText = '';

  // 1. ƯU TIÊN HÀNG ĐẦU: Gửi hình ảnh trực tiếp (Multimodal Vision AI) cho Gemini
  // Giúp giảm thời gian từ >30 giây xuống chỉ còn 1.5 - 2.5 giây!
  if (process.env.GEMINI_API_KEY) {
    const rawCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash'
    ].filter(Boolean);
    const candidateModels = [...new Set(rawCandidates)];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of candidateModels) {
      try {
        logger.info(`[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Google Gemini Vision (${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        });

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
  if (!directText && process.env.ANTHROPIC_API_KEY) {
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

  // 3. FALLBACK 2: Trích xuất chữ bằng Tesseract OCR nếu các AI Vision đều không hoạt động
  logger.info("[Quét đơn thuốc] Kích hoạt Fallback - Trích xuất chữ bằng Tesseract OCR...");
  const tessdataDir = path.join(__dirname, '../../../database/tessdata');
  if (!fs.existsSync(tessdataDir)) {
    fs.mkdirSync(tessdataDir, { recursive: true });
  }

  let ocrText = '';
  try {
    const ocrResult = await Tesseract.recognize(
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
    );
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
        });
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
