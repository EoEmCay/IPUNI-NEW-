const svc = require('./scan.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const { findMedicationInDatabase } = require('./scan.service');

const fs = require('fs');

async function analyzePrescription(req, res, next) {
  try {
    req.setTimeout(300000);
    console.log("Received scan request. File size:", req.file ? req.file.size : 'No file');
    if (!req.file) return sendError(res, 'Vui lòng chọn ảnh đơn thuốc', 400);

    const user = req.user;

    const fileBuffer = fs.readFileSync(req.file.path);

    const lang = req.body.lang || 'vi';
    const result = await svc.analyzePrescription(fileBuffer, req.file.mimetype, lang);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    sendSuccess(res, result, 'Phân tích đơn thuốc thành công');
  } catch (err) {
    console.error('[Scan Controller] Error:', err.message);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    // IMPORTANT: Never return 401 from scan endpoint — external AI API errors
    // (Gemini/Anthropic) may have status 401 (invalid API key), but this should
    // NOT cause the frontend to think the user's JWT is invalid and redirect to login.
    if (err.status && err.status !== 401) return sendError(res, err.message, err.status);
    return sendError(res, err.message || 'Lỗi phân tích đơn thuốc. Vui lòng thử lại.', 500);
  }
}

async function getMedicationDetail(req, res, next) {
  try {
    const { name } = req.params;
    if (!name) return sendError(res, 'Vui lòng cung cấp tên thuốc', 400);

    const medication = findMedicationInDatabase(name);
    if (!medication) return sendError(res, 'Không tìm thấy thông tin thuốc này', 404);

    sendSuccess(res, medication, 'Thông tin chi tiết thuốc');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { analyzePrescription, getMedicationDetail };

