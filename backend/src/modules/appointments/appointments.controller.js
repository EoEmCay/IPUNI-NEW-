const svc = require('./appointments.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getAppointments(req, res, next) {
  try { sendSuccess(res, await svc.getAppointments(req.user.id, req.query.status)); } catch (err) { next(err); }
}

async function getDoctorNotes(req, res, next) {
  try { sendSuccess(res, await svc.getDoctorNotes(req.user.id)); } catch (err) { next(err); }
}

async function createAppointment(req, res, next) {
  try { sendSuccess(res, await svc.createAppointment(req.user.id, req.validatedBody), 'Đã thêm lịch hẹn', 201); } catch (err) { next(err); }
}

async function updateAppointment(req, res, next) {
  try {
    sendSuccess(res, await svc.updateAppointment(req.user.id, req.params.id, req.body));
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function deleteAppointment(req, res, next) {
  try {
    await svc.deleteAppointment(req.user.id, req.params.id);
    sendSuccess(res, null, 'Đã xóa lịch hẹn');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { getAppointments, getDoctorNotes, createAppointment, updateAppointment, deleteAppointment };
