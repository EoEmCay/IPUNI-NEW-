const svc = require('./medications.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getMedications(req, res, next) {
  try { sendSuccess(res, await svc.getMedications(req.user.id)); } catch (err) { next(err); }
}

async function getTodayMedications(req, res, next) {
  try { sendSuccess(res, await svc.getTodayMedications(req.user.id)); } catch (err) { next(err); }
}

async function createMedication(req, res, next) {
  try { sendSuccess(res, await svc.createMedication(req.user.id, req.validatedBody), 'Đã thêm thuốc', 201); } catch (err) { next(err); }
}

async function updateMedication(req, res, next) {
  try {
    const data = await svc.updateMedication(req.user.id, req.params.id, req.body);
    sendSuccess(res, data, 'Đã cập nhật thuốc');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function deleteMedication(req, res, next) {
  try {
    await svc.deleteMedication(req.user.id, req.params.id);
    sendSuccess(res, null, 'Đã xóa thuốc');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { getMedications, getTodayMedications, createMedication, updateMedication, deleteMedication };
