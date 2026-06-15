const svc = require('./scan.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const { findMedicationInDatabase } = require('./scan.service');

async function analyzePrescription(req, res, next) {
  try {
    req.setTimeout(300000);
    console.log("Received scan request. File size:", req.file ? req.file.size : 'No file');
    if (!req.file) return sendError(res, 'Vui lòng chọn ảnh đơn thuốc', 400);

    const user = req.user;

    const result = await svc.analyzePrescription(req.file.buffer, req.file.mimetype);

    sendSuccess(res, result, 'Phân tích đơn thuốc thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
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
