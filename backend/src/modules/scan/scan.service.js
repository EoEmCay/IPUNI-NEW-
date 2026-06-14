const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../../utils/logger');

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

const PROMPT = `You are an expert medical assistant. Analyze the medical prescription (either from the image directly or from the OCR text provided) and convert it into a structured JSON object.
All Vietnamese values must be direct, short, and contain no filler words.
If isDiabetesPrescription is false, you should still attempt to parse the medications in the prescription.

JSON Schema:
{
  "isPrescription": true/false (true if the image/text represents a medical prescription),
  "isDiabetesPrescription": true/false (true if the diagnosis, symptoms, or any of the medications are for diabetes/đái tháo đường/tiểu đường),
  "rejectionReason": "Detailed reason in Vietnamese why this is not a prescription or not related to diabetes" or null,
  "doctorName": "Doctor name" or null,
  "prescriptionDate": "Prescription date in YYYY-MM-DD format" or null,
  "diagnosis": "Detailed diagnosis in Vietnamese" or null,
  "doctorNotes": "Doctor instructions/notes in Vietnamese" or null,
  "medications": [{
    "name": "Drug name only (e.g. Metformin, Galvus Met)",
    "dosage": "Dosage (e.g. 500mg, 1000mg)",
    "quantity": "Total quantity prescribed (e.g. 30 viên, 2 lọ)" or null,
    "amountPerDose": "Amount per dose (e.g. 1 viên, 2 viên)",
    "timesPerDay": times_per_day_number,
    "frequency": "Frequency description (e.g. 2 lần/ngày, 1 lần/ngày)",
    "times": ["HH:MM"] (Map time keywords to HH:MM format. Sáng->07:00, Trưa->12:00, Chiều->15:00, Tối->19:00, Trước ngủ/Tối muộn->22:00. Adjust based on instructions),
    "instructions": "Full usage instructions in Vietnamese",
    "isDiabetesDrug": true/false (true if this medication is specifically for diabetes/lowering blood glucose/insulin),
    "detail": {
      "purpose": "Brief drug purpose in Vietnamese",
      "mechanism": "Brief mechanism of action in Vietnamese",
      "sideEffects": "Common side effects in Vietnamese",
      "source": "ADA/Mayo Clinic/Vinmec/MedlinePlus"
    }
  }]
}`;

function shapeResult(parsed) {
  const isPrescription = parsed.isPrescription !== false;
  const medications = parsed.medications || [];

  const keywordDiabetes = medications.some(m => isDiabetesDrug(m.name));
  const isDiabetesPrescription =
    parsed.isDiabetesPrescription === true || 
    isDiabetesDiagnosis(parsed.diagnosis) ||
    (parsed.isDiabetesPrescription == null && keywordDiabetes);

  const diabetesDrugs = medications
    .filter(m => m.isDiabetesDrug === true || isDiabetesDrug(m.name))
    .map(m => m.name);

  return {
    isPrescription,
    isDiabetesPrescription,
    rejectionReason: parsed.rejectionReason || null,
    medications: isDiabetesPrescription ? medications : [],
    hasDiabetesDrugs: diabetesDrugs.length > 0,
    diabetesDrugs,
    doctorName: parsed.doctorName || null,
    prescriptionDate: parsed.prescriptionDate || null,
    diagnosis: parsed.diagnosis || null,
    doctorNotes: parsed.doctorNotes || parsed.notes || null,
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
async function analyzePrescription(imageBuffer, mimeType) {
  let text = '';
  let imageBase64 = null;
  
  if (imageBuffer) {
    imageBase64 = imageBuffer.toString('base64');
  }

  // 1. Dùng Gemini nếu có API Key (Khuyên dùng để đạt độ chính xác 100%)
  if (process.env.GEMINI_API_KEY) {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
      logger.info(`[Quét đơn thuốc] Phát hiện GEMINI_API_KEY. Đang phân tích trực tiếp bằng hình ảnh với Google Gemini (${modelName})...`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      };

      const result = await model.generateContent([
        PROMPT,
        imagePart
      ]);
      text = result.response.text();
      logger.info("[Quét đơn thuốc] Phân tích bằng Gemini trực tiếp qua hình ảnh thành công!");
    } catch (geminiError) {
      logger.error("[Quét đơn thuốc] Lỗi khi gọi Gemini API trực tiếp qua hình ảnh: " + geminiError.message, geminiError);
    }
  }

  // 2. Dùng Anthropic Claude nếu có API Key và chưa có kết quả
  if (!text && process.env.ANTHROPIC_API_KEY) {
    try {
      logger.info("[Quét đơn thuốc] Phát hiện ANTHROPIC_API_KEY. Đang phân tích trực tiếp bằng hình ảnh với Anthropic Claude...");
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
                text: PROMPT
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
      text = response.content[0].text;
      logger.info("[Quét đơn thuốc] Phân tích bằng Claude trực tiếp qua hình ảnh thành công!");
    } catch (claudeError) {
      logger.error("[Quét đơn thuốc] Lỗi khi gọi Anthropic API trực tiếp qua hình ảnh: " + claudeError.message, claudeError);
    }
  }

  // 3. Dự phòng (Fallback): Dùng Tesseract OCR để trích xuất chữ và gửi Text cho LLM
  if (!text) {
    logger.info("[Quét đơn thuốc] Đang kích hoạt Fallback: Trích xuất chữ từ ảnh bằng Tesseract OCR...");
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
      logger.info(`[Quét đơn thuốc] Trích xuất bằng Tesseract hoàn tất. Kích thước văn bản: ${ocrText.length} ký tự.`);
    } catch (ocrError) {
      logger.error("[Quét đơn thuốc] Lỗi khi nhận diện chữ bằng Tesseract OCR: " + ocrError.message);
    }

    if (ocrText) {
      const promptWithOcr = `${PROMPT}
      
Dữ liệu chữ trích xuất từ Tesseract OCR cần phân tích và sắp xếp thành cấu trúc JSON:
---
${ocrText}
---`;

      if (process.env.GEMINI_API_KEY) {
        try {
          const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
          logger.info(`[Quét đơn thuốc] Phân tích dữ liệu OCR bằng Google Gemini (${modelName})...`);
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' }
          });
          const result = await model.generateContent([promptWithOcr]);
          text = result.response.text();
        } catch (geminiError) {
          logger.error("[Quét đơn thuốc] Lỗi khi gọi Gemini API với văn bản OCR: " + geminiError.message);
        }
      }

      if (!text && process.env.ANTHROPIC_API_KEY) {
        try {
          logger.info("[Quét đơn thuốc] Phân tích dữ liệu OCR bằng Anthropic Claude...");
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
        } catch (claudeError) {
          logger.error("[Quét đơn thuốc] Lỗi khi gọi Anthropic API với văn bản OCR: " + claudeError.message);
        }
      }
    }
  }

  // 4. Nếu không có API Key nào hoặc phân tích thất bại hoàn toàn
  if (!text) {
    throw new Error('Vui lòng cấu hình GEMINI_API_KEY trong file backend/.env và đảm bảo ảnh đơn thuốc rõ nét.');
  }

  logger.info(`[Quét đơn thuốc] Kích thước nội dung phản hồi từ AI: ${text.length} ký tự.`);
  
  logger.info("[Quét đơn thuốc] Đang tiến hành bóc tách và phân tích cú pháp JSON...");
  let parsed = parseAiJson(text);
  
  logger.info("[Quét đơn thuốc] Đang chuẩn hóa cấu trúc dữ liệu đơn thuốc (medications, chẩn đoán, bác sĩ)...");
  const result = shapeResult(parsed);
  
  logger.info("[Quét đơn thuốc] Phân tích đơn thuốc hoàn tất thành công!");
  return result;
}

module.exports = { analyzePrescription, shapeResult, parseAiJson, isDiabetesDrug };
