'use strict';

const careService = require('./care.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const db = require('../../config/database');

async function resolvePatientId(req) {
  const queryPatientId = req.query.patient_id || req.body?.patient_id;
  if (!queryPatientId || Number(queryPatientId) === req.user.id) {
    return req.user.id;
  }

  const patientId = Number(queryPatientId);
  // Kiểm tra liên kết gia đình / người chăm sóc qua care_links
  const link = await db('care_links')
    .where({ patient_id: patientId, status: 'active' })
    .where((builder) => {
      builder.where('member_id', req.user.id)
        .orWhere('contact_email', req.user.email)
        .orWhere('contact_phone', req.user.phone);
    })
    .first();

  if (!link) {
    throw new Error('Bạn không có quyền xem thông tin của bệnh nhân này');
  }

  return patientId;
}

async function getLiveTimeline(req, res, next) {
  try {
    const patientId = await resolvePatientId(req);
    const dateStr = req.query.date || null;
    const timeline = await careService.getTimeline(patientId, dateStr);
    return sendSuccess(res, timeline, 'Lấy dòng thời gian thành công');
  } catch (err) {
    next(err);
  }
}

async function getWeeklySummary(req, res, next) {
  try {
    const patientId = await resolvePatientId(req);
    const insights = await careService.getWeeklyInsights(patientId);
    return sendSuccess(res, insights, 'Lấy bản tin tuần thành công');
  } catch (err) {
    next(err);
  }
}

async function getDoctorReport(req, res, next) {
  try {
    const patientId = await resolvePatientId(req);
    const report = await careService.getDoctorBriefing(patientId);
    return sendSuccess(res, report, 'Lấy báo cáo bác sĩ thành công');
  } catch (err) {
    next(err);
  }
}

async function logCaregiverDose(req, res, next) {
  try {
    const patientId = await resolvePatientId(req);
    const { medication_id, slot, scheduled_for, taken_at, note, reason, status = 'taken' } = req.body;
    if (!medication_id) {
      return sendError(res, 'Thiếu thông tin thuốc', 400);
    }

    const log = await careService.logDose(patientId, Number(medication_id), {
      status,
      scheduledFor: scheduled_for,
      takenAt: taken_at || new Date().toISOString(),
      reason: note || reason,
    });

    return sendSuccess(res, log, 'Đã ghi nhận cữ thuốc thành công', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLiveTimeline,
  getWeeklySummary,
  getDoctorReport,
  logCaregiverDose,
};
