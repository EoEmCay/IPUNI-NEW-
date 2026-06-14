// Using Ollama locally for AI vision instead of external API

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
];

function isDiabetesDrug(name) {
  const lower = (name || '').toLowerCase();
  return DIABETES_KEYWORDS.some(k => lower.includes(k));
}

const PROMPT = `Bạn là dược sĩ lâm sàng chuyên về đái tháo đường, đọc đơn thuốc Việt Nam (kể cả chữ viết tay của bác sĩ).

Phân tích ảnh và trả về JSON HỢP LỆ, KHÔNG kèm bất kỳ text nào ngoài JSON.

BƯỚC 1 — Xác định loại đơn:
- "isPrescription": true nếu ảnh là một đơn thuốc / toa thuốc y tế; false nếu không phải.
- "isDiabetesPrescription": true CHỈ KHI đơn này dùng để điều trị bệnh đái tháo đường (tiểu đường) — căn cứ vào chẩn đoán ghi trên đơn HOẶC có ít nhất một thuốc hạ đường huyết (metformin, gliclazide, glimepiride, insulin, sitagliptin, empagliflozin, dapagliflozin, ...). Nếu đơn cho bệnh khác (cảm cúm, huyết áp đơn thuần, dạ dày, ...) thì để false.
- "rejectionReason": nếu isDiabetesPrescription = false, ghi ngắn gọn lý do bằng tiếng Việt (vd: "Đây là đơn thuốc điều trị cảm cúm, không phải đái tháo đường"). Nếu là đơn tiểu đường thì để null.

Nếu KHÔNG phải đơn tiểu đường, CHỈ cần trả về:
{"isPrescription": <true/false>, "isDiabetesPrescription": false, "rejectionReason": "...", "medications": []}

BƯỚC 2 — Nếu LÀ đơn tiểu đường, trích xuất đầy đủ:
{
  "isPrescription": true,
  "isDiabetesPrescription": true,
  "rejectionReason": null,
  "doctorName": "tên bác sĩ nếu đọc được, hoặc null",
  "prescriptionDate": "YYYY-MM-DD hoặc null",
  "diagnosis": "chẩn đoán ghi trên đơn, hoặc null",
  "doctorNotes": "diễn giải lại TOÀN BỘ chữ viết tay và lời dặn của bác sĩ thành tiếng Việt rõ ràng (vd: tái khám sau 1 tháng, kiêng đường, tập thể dục...). null nếu không có",
  "medications": [
    {
      "name": "tên thuốc (chỉ tên, không kèm liều)",
      "dosage": "hàm lượng mỗi viên (vd: 500mg, 30mg)",
      "quantity": "tổng số lượng kê (vd: 60 viên, 2 hộp), hoặc null",
      "amountPerDose": "lượng mỗi lần uống (vd: 1 viên, nửa viên)",
      "timesPerDay": <số lần uống trong 1 ngày, kiểu số>,
      "frequency": "mô tả tần suất (vd: 2 lần/ngày, sáng-tối)",
      "times": ["07:00"],
      "instructions": "cách dùng: trước ăn / sau ăn / trước ngủ ...",
      "isDiabetesDrug": <true nếu là thuốc hạ đường huyết, false nếu thuốc hỗ trợ khác>,
      "detail": {
        "purpose": "công dụng: thuốc này dùng để làm gì cho bệnh nhân tiểu đường",
        "mechanism": "cơ chế / giải quyết vấn đề gì (vd: giảm đường huyết bằng cách...)",
        "sideEffects": "tác dụng phụ thường gặp cần lưu ý",
        "source": "nguồn tham khảo uy tín (vd: Hiệp hội Đái tháo đường Hoa Kỳ ADA, Mayo Clinic, Vinmec, MedlinePlus)"
      }
    }
  ]
}

Quy tắc "times" (mảng giờ HH:MM, suy ra từ timesPerDay và lời dặn):
- Sáng → "07:00" | Trưa → "12:00" | Chiều → "15:00" | Tối → "19:00" | Trước ngủ/đêm → "22:00"
- Nếu không rõ giờ nhưng biết số lần/ngày, hãy phân bổ hợp lý. Nếu hoàn toàn không rõ → [].

Phần "detail" PHẢI điền cho MỌI thuốc, nội dung dựa trên kiến thức y khoa chuẩn từ nguồn uy tín, viết bằng tiếng Việt dễ hiểu cho bệnh nhân.

Nếu ảnh quá mờ không đọc được: {"isPrescription": false, "isDiabetesPrescription": false, "rejectionReason": null, "medications": [], "error": "Không thể đọc ảnh đơn thuốc, vui lòng chụp rõ hơn"}`;

function shapeResult(parsed) {
  const isPrescription = parsed.isPrescription !== false;
  const medications = parsed.medications || [];

  const keywordDiabetes = medications.some(m => isDiabetesDrug(m.name));
  const isDiabetesPrescription =
    parsed.isDiabetesPrescription === true || (parsed.isDiabetesPrescription == null && keywordDiabetes);

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
  try {
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(jsonMatch ? jsonMatch[1].trim() : trimmed);
  } catch (error) {
    console.error("parseAiJson error. Raw text from AI:", text);
    throw error;
  }
}

const axios = require('axios');

async function analyzePrescription(imageBuffer, mimeType) {
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const modelName = 'llava-phi3';

  try {
    const base64Image = imageBuffer.toString('base64');

    console.log(`Starting Ollama ${modelName} vision call...`);
    console.log(`Ollama Host: ${ollamaHost}`);

    const response = await axios.post(
      `${ollamaHost}/api/generate`,
      {
        model: modelName,
        prompt: PROMPT,
        images: [base64Image],
        stream: false,
        temperature: 0.3,
      },
      { timeout: 300000 }
    );

    const text = response.data.response || '';
    console.log('Ollama response text length:', text.length);

    let parsed = parseAiJson(text);
    return shapeResult(parsed);

  } catch (error) {
    console.error('Ollama Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return {
        isPrescription: false,
        isDiabetesPrescription: false,
        medications: [],
        hasDiabetesDrugs: false,
        diabetesDrugs: [],
        error: 'Ollama server không hoạt động. Vui lòng khởi chạy Ollama.'
      };
    }

    return {
      isPrescription: false,
      isDiabetesPrescription: false,
      medications: [],
      hasDiabetesDrugs: false,
      diabetesDrugs: [],
      error: 'Lỗi phân tích từ Ollama: ' + (error.message || 'Unknown error')
    };
  }
}

module.exports = { analyzePrescription, shapeResult, parseAiJson, isDiabetesDrug };
