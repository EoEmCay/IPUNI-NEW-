'use strict';
const db = require('../../config/database');
const { computeAdherence } = require('../medications/adherence.service');
const { CLINIC_THRESHOLDS, isVirtualPatient } = require('./clinic.constants');

async function getProvider(providerId) {
  const provider = await db('users').where({ id: providerId }).first();
  if (!provider || !['doctor', 'clinic_admin'].includes(provider.role)) {
    throw { status: 403, message: 'Chỉ bác sĩ / quản trị phòng khám mới truy cập được' };
  }
  return provider;
}

/** Kiểm tra 1 provider có quyền xem hồ sơ 1 bệnh nhân không. */
async function assertCanView(providerId, patientId) {
  const provider = await getProvider(providerId);
  const link = await db('care_links')
    .where({ patient_id: patientId, member_id: providerId, status: 'active' })
    .first();
  if (link) return provider;
  if (provider.clinic_id) {
    const patient = await db('users').where({ id: patientId }).first();
    if (patient && patient.clinic_id === provider.clinic_id) return provider;
  }
  throw { status: 403, message: 'Không có quyền xem hồ sơ bệnh nhân này' };
}

/** Danh sách bệnh nhân của 1 bác sĩ/phòng khám + cờ trạng thái. */
async function getPatientBoard(providerId, { includeVirtual = false } = {}) {
  const provider = await getProvider(providerId);

  const rows = await db('users as u')
    .leftJoin('care_links as c', function () {
      this.on('c.patient_id', 'u.id')
        .andOn('c.member_id', db.raw('?', [providerId]))
        .andOn('c.relation', db.raw("'doctor'"))
        .andOn('c.status', db.raw("'active'"));
    })
    .where('u.role', 'patient')
    .andWhere((q) => {
      q.whereNotNull('c.id');
      if (provider.clinic_id) q.orWhere('u.clinic_id', provider.clinic_id);
    })
    .select('u.id', 'u.name', 'u.email', 'u.cccd', 'u.phone', 'u.diagnosis', 'u.plan', 'u.created_at')
    .groupBy('u.id');

  const patients = includeVirtual ? rows : rows.filter((p) => !isVirtualPatient(p));

  const now = Date.now();
  const board = await Promise.all(
    patients.map(async (p) => {
      const recent = await db('metrics')
        .where({ user_id: p.id, measurement_category: 'glucose' })
        .andWhere('measured_at', '>=', new Date(now - 72 * 3600000).toISOString())
        .orderBy('measured_at', 'desc');

      const last = await db('metrics')
        .where({ user_id: p.id, measurement_category: 'glucose' })
        .orderBy('measured_at', 'desc')
        .first();

      const adh = await computeAdherence(p.id, 30);

      const flags = [];
      const hypo = recent.find((r) => Number(r.value) < CLINIC_THRESHOLDS.HYPO);
      const hyper = recent.find((r) => Number(r.value) > CLINIC_THRESHOLDS.SEVERE_HYPER);
      if (hypo) flags.push({ type: 'hypo', severity: 'critical', label: '🚨 Hạ đường huyết', value: hypo.value, at: hypo.measured_at });
      if (hyper) flags.push({ type: 'severe_hyper', severity: 'critical', label: '🚨 Tăng đường huyết nặng', value: hyper.value, at: hyper.measured_at });
      if (adh.isPoorAdherence) flags.push({ type: 'low_adherence', severity: 'warning', label: `⚠️ Tuân thủ ${adh.adherencePercent}%`, value: adh.adherencePercent });

      const lastDays = last ? Math.floor((now - new Date(last.measured_at).getTime()) / 86400000) : null;
      if (lastDays == null || lastDays >= CLINIC_THRESHOLDS.INACTIVE_DAYS) {
        flags.push({ type: 'inactive', severity: 'warning', label: '⚠️ Lâu không đo', value: lastDays });
      }

      const hasCritical = flags.some((f) => f.severity === 'critical');
      return {
        id: p.id,
        name: p.name || '(chưa đặt tên)',
        isVirtual: isVirtualPatient(p),
        diagnosis: p.diagnosis,
        cccdMasked: p.cccd ? String(p.cccd).replace(/^(\d{3})\d+(\d{3})$/, '$1******$2') : null,
        phone: p.phone,
        lastGlucose: last ? { value: last.value, type: last.measurement_type, at: last.measured_at } : null,
        lastMeasuredDaysAgo: lastDays,
        adherencePercent: adh.adherencePercent,
        needsAttention: hasCritical || adh.isPoorAdherence,
        priority: hasCritical ? 2 : flags.length ? 1 : 0,
        flags,
      };
    }),
  );

  board.sort((a, b) => b.priority - a.priority || (a.name > b.name ? 1 : -1));
  return { generatedAt: new Date().toISOString(), total: board.length, patients: board };
}

/** Chi tiết 1 bệnh nhân cho bác sĩ (đã kiểm tra quyền). */
async function getPatientDetail(providerId, patientId, days = 30) {
  await assertCanView(providerId, patientId);
  const from = new Date(Date.now() - days * 86400000).toISOString();

  const [metrics, meds, logs, adh, appts, patient, alerts] = await Promise.all([
    db('metrics').where({ user_id: patientId }).andWhere('measured_at', '>=', from).orderBy('measured_at', 'desc'),
    db('medications').where({ user_id: patientId }),
    db('medication_logs').where({ user_id: patientId }).andWhere('scheduled_for', '>=', from).orderBy('scheduled_for', 'desc'),
    computeAdherence(patientId, days),
    db('appointments').where({ user_id: patientId }).orderBy('scheduled_at', 'desc'),
    db('users')
      .where({ id: patientId })
      .select('id', 'name', 'cccd', 'phone', 'date_of_birth', 'diagnosis', 'blood_type', 'allergies')
      .first(),
    db('clinical_alerts').where({ patient_id: patientId }).orderBy('created_at', 'desc').limit(50),
  ]);

  return { patient, metrics, medications: meds, medicationLogs: logs, adherence: adh, appointments: appts, alerts };
}

async function acknowledgeAlert(providerId, alertId) {
  const alert = await db('clinical_alerts').where({ id: alertId }).first();
  if (!alert) throw { status: 404, message: 'Không tìm thấy cảnh báo' };
  await assertCanView(providerId, alert.patient_id);
  await db('clinical_alerts').where({ id: alertId }).update({ acknowledged: true, acknowledged_by: providerId });
  return { ok: true };
}

module.exports = { getPatientBoard, getPatientDetail, acknowledgeAlert, assertCanView };
