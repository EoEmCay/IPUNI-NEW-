const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
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
  'siofor', 'gliclada', 'tirzepatide', 'mounjaro', 'rybelsus', 'jardiance duo'
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
    "instructions": "Full usage instructions in ${targetLang}",
    "isDiabetesDrug": true/false (true if this medication is specifically for diabetes/lowering blood glucose/insulin),
    "detail": {
      "purpose": "Brief drug purpose in ${targetLang} (based on standard medical references)",
      "mechanism": "Brief mechanism of action in ${targetLang} (based on standard medical references)",
      "source": "Mặc định luôn điền 'Dược Thư Quốc Gia Việt Nam'"
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
  const medications = parsed.medications || [];
  
  // Một đơn thuốc hợp lệ phải có chứa danh sách thuốc kê đơn.
  // Nếu danh sách thuốc trống, tài liệu này không thể được xử lý như một đơn thuốc.
  const isPrescription = parsed.isPrescription !== false && medications.length > 0;

  const keywordDiabetes = medications.some(m => isDiabetesDrug(m.name));
  const isDiabetesPrescription =
    isPrescription && (
      parsed.isDiabetesPrescription === true || 
      isDiabetesDiagnosis(parsed.diagnosis) ||
      (parsed.isDiabetesPrescription == null && keywordDiabetes)
    );

  const diabetesDrugs = medications
    .filter(m => m.isDiabetesDrug === true || isDiabetesDrug(m.name))
    .map(m => m.name);

  return {
    isPrescription,
    isDiabetesPrescription,
    rejectionReason: !isPrescription 
      ? (parsed.rejectionReason || 'Không tìm thấy thông tin thuốc được kê trong tài liệu này (ví dụ: đây là kết quả xét nghiệm hoặc ảnh chụp quá mờ).')
      : (parsed.rejectionReason || null),
    medications: isDiabetesPrescription ? medications : [],
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
  
  // 1. Tìm cặp dấu ngoặc {} đầu tiên và cuối cùng
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  // 2. Loại bỏ các comment thường gặp
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ''); // /* ... */
  cleaned = cleaned.replace(/(?:^|[^:])\/\/.*$/gm, ''); // // ...

  // 3. Loại bỏ dấu phẩy thừa trước dấu đóng ngoặc nhọn hoặc ngoặc vuông
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

  // 4. Thử parse trực tiếp
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    logger.warn("First JSON parse failed. Attempting to repair...");
  }

  // 5. Khắc phục các lỗi cú pháp JSON phổ biến của LLM nhỏ
  try {
    let repaired = cleaned;
    
    // Sửa dấu nháy đơn thành nháy kép cho các thuộc tính và giá trị
    repaired = repaired.replace(/'([^'\r\n]+)'\s*:/g, '"$1":'); // 'key': -> "key":
    repaired = repaired.replace(/:\s*'([^'\r\n]+)'/g, ': "$1"'); // : 'val' -> : "val"
    
    // Tự động thêm dấu nháy kép cho các key không có nháy kép (vd: isPrescription: -> "isPrescription":)
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    // Thêm các dấu phẩy bị thiếu giữa các thuộc tính phân dòng
    repaired = repaired.replace(/"\s*(\r?\n)\s*"/g, '",$1"');

    // Escaping các ký tự xuống dòng hoặc tab nằm bên trong chuỗi giá trị nháy kép
    repaired = repaired.replace(/"([^"]*)"/g, (match, p1) => {
      return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
    });

    return JSON.parse(repaired);
  } catch (repairError) {
    logger.error("JSON Repair failed. Raw text from AI: " + text, repairError);
    logger.error("Attempted clean text: " + cleaned);
    throw repairError;
  }
}

// Using LLM (Gemini/Claude) with direct image/multimodal input for best accuracy.
// Tesseract OCR is kept as a robust fallback.
async function analyzePrescription(imageBuffer, mimeType, lang = 'vi') {
  const dynamicPrompt = getPrompt(lang);
  if (!imageBuffer) {
    throw new Error('Không nhận được dữ liệu hình ảnh.');
  }

  let text = '';
  let ocrText = '';
  let useFallbackDirectGemini = false;

  // 1. Thử trích xuất chữ bằng Tesseract OCR trước
  logger.info("[Quét đơn thuốc] Bước 1: Trích xuất chữ từ ảnh bằng Tesseract OCR...");
  const tessdataDir = path.join(__dirname, '../../../database/tessdata');
  if (!fs.existsSync(tessdataDir)) {
    fs.mkdirSync(tessdataDir, { recursive: true });
  }

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
    logger.info(`[Quét đơn thuốc] Trích xuất bằng Tesseract hoàn tất. Kích thước văn bản: ${ocrText.length} ký tự.`);
  } catch (ocrError) {
    logger.error("[Quét đơn thuốc] Lỗi Tesseract OCR: " + ocrError.message);
    useFallbackDirectGemini = true;
  }

  if (!ocrText || ocrText.trim().length === 0) {
    logger.warn("[Quét đơn thuốc] OCR không trích xuất được chữ nào. Sẽ chuyển sang phân tích hình ảnh trực tiếp.");
    useFallbackDirectGemini = true;
  }

  // 2. Nếu có chữ từ OCR, gửi chữ này cho AI xử lý trước
  if (!useFallbackDirectGemini && ocrText) {
    const promptWithOcr = `${dynamicPrompt}
      
Dữ liệu chữ trích xuất từ Tesseract OCR cần phân tích và sắp xếp thành cấu trúc JSON:
---
${ocrText}
---`;

    // Thử gửi cho Gemini trước
    if (process.env.GEMINI_API_KEY) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
        logger.info(`[Quét đơn thuốc] Phân tích văn bản OCR bằng Google Gemini (${modelName})...`);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { 
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        });
        const result = await model.generateContent([promptWithOcr]);
        text = result.response.text();
        logger.info("[Quét đơn thuốc] Nhận phản hồi từ Gemini cho văn bản OCR.");
      } catch (geminiError) {
        logger.error("[Quét đơn thuốc] Lỗi Gemini với văn bản OCR: " + geminiError.message);
      }
    }

    // Thử gửi cho Claude nếu Gemini không có key hoặc lỗi
    if (!text && process.env.ANTHROPIC_API_KEY) {
      try {
        logger.info("[Quét đơn thuốc] Phân tích văn bản OCR bằng Anthropic Claude...");
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: promptWithOcr
            }
          ]
        });
        text = response.content[0].text;
        logger.info("[Quét đơn thuốc] Nhận phản hồi từ Claude cho văn bản OCR.");
      } catch (claudeError) {
        logger.error("[Quét đơn thuốc] Lỗi Claude với văn bản OCR: " + claudeError.message);
      }
    }

    // Parse thử kết quả của OCR + AI
    if (text) {
      try {
        const parsed = parseAiJson(text);
        const shaped = shapeResult(parsed);
        // Nếu AI xác nhận là đơn thuốc tiểu đường hợp lệ, ta dùng luôn kết quả này
        if (shaped.isPrescription && shaped.isDiabetesPrescription) {
          logger.info("[Quét đơn thuốc] Nhận diện thành công đơn thuốc tiểu đường từ văn bản OCR.");
          return shaped;
        } else {
          logger.warn("[Quét đơn thuốc] Văn bản OCR phân tích ra không phải đơn thuốc tiểu đường hoặc không hợp lệ. Sẽ kích hoạt fallback ảnh trực tiếp.");
          useFallbackDirectGemini = true;
        }
      } catch (parseError) {
        logger.warn("[Quét đơn thuốc] Lỗi parse kết quả OCR AI: " + parseError.message + ". Kích hoạt fallback ảnh trực tiếp.");
        useFallbackDirectGemini = true;
      }
    } else {
      useFallbackDirectGemini = true;
    }
  }

  // 3. Fallback: Nếu OCR thất bại / AI phân tích OCR không ra đơn thuốc tiểu đường,
  // chúng ta gửi hình ảnh trực tiếp (Multimodal) cho Gemini/Claude
  if (useFallbackDirectGemini) {
    logger.info("[Quét đơn thuốc] Bước 2: Kích hoạt Fallback - Phân tích ảnh trực tiếp (Multimodal AI)...");
    const imageBase64 = imageBuffer.toString('base64');
    let directText = '';

    // Thử dùng Gemini trực tiếp với hình ảnh
    if (process.env.GEMINI_API_KEY) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
        logger.info(`[Quét đơn thuốc] Gửi ảnh trực tiếp cho Google Gemini (${modelName})...`);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        logger.info("[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Gemini thành công!");
      } catch (geminiError) {
        logger.error("[Quét đơn thuốc] Lỗi Gemini khi phân tích ảnh trực tiếp: " + geminiError.message, geminiError);
      }
    }

    // Thử dùng Claude trực tiếp với hình ảnh
    if (!directText && process.env.ANTHROPIC_API_KEY) {
      try {
        logger.info("[Quét đơn thuốc] Gửi ảnh trực tiếp cho Anthropic Claude...");
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
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
        logger.info("[Quét đơn thuốc] Phân tích ảnh trực tiếp bằng Claude thành công!");
      } catch (claudeError) {
        logger.error("[Quét đơn thuốc] Lỗi Claude khi phân tích ảnh trực tiếp: " + claudeError.message, claudeError);
      }
    }

    if (directText) {
      const parsed = parseAiJson(directText);
      const shaped = shapeResult(parsed);
      logger.info("[Quét đơn thuốc] Phân tích ảnh trực tiếp hoàn tất.");
      return shaped;
    }
  }

  // 4. Nếu tất cả đều thất bại
  throw new Error('Vui lòng cấu hình GEMINI_API_KEY hoặc ANTHROPIC_API_KEY và đảm bảo kết nối mạng ổn định.');
}

module.exports = { analyzePrescription, shapeResult, parseAiJson, isDiabetesDrug, findMedicationInDatabase };
