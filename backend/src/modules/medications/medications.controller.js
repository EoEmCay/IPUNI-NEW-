const svc = require('./medications.service');
const adherence = require('./adherence.service');
const { publish } = require('../../realtime/eventBus');
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
    const data = await svc.updateMedication(req.user.id, req.params.id, req.validatedBody || req.body);
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

async function logDose(req, res, next) {
  try {
    const log = await adherence.logDose(req.user.id, Number(req.params.id), req.validatedBody || req.body || {});
    publish('patient.medication_logged', { patientId: req.user.id, log });
    sendSuccess(res, log, 'Đã ghi nhận', 201);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function getAdherence(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 180);
    sendSuccess(res, await adherence.computeAdherence(req.user.id, days));
  } catch (err) { next(err); }
}

async function getDoseHistory(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
    sendSuccess(res, await adherence.getDoseHistory(req.user.id, days));
  } catch (err) { next(err); }
}

async function getUpcomingDoses(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 30);
    sendSuccess(res, await adherence.getUpcomingDoses(req.user.id, days));
  } catch (err) { next(err); }
}

module.exports = {
  getMedications,
  getTodayMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  logDose,
  getAdherence,
  getDoseHistory,
  getUpcomingDoses,
};
