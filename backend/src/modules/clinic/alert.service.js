'use strict';
const db = require('../../config/database');
const { publish } = require('../../realtime/eventBus');
const { CLINIC_THRESHOLDS } = require('./clinic.constants');
const { notifyCaregivers } = require('./caregiverNotify');
const logger = require('../../utils/logger');

/** Đưa 1 cảnh báo vào clinical_alerts (idempotent theo dedupe_key) + phát realtime + báo người nhà nếu critical. */
async function queue(patientId, alert) {
  try {
    await db('clinical_alerts')
      .insert({ patient_id: patientId, ...alert })
      .onConflict(['patient_id', 'dedupe_key'])
      .ignore();
  } catch (e) {
    logger.warn(`[Alert] queue lỗi: ${e.message}`);
  }

  const row = await db('clinical_alerts')
    .where({ patient_id: patientId, dedupe_key: alert.dedupe_key })
    .first();
  if (!row) return null;

  publish('clinical.alert', { patientId, alert: row });

  if (!row.notified_caregiver) {
    const flag = alert.type === 'missed_dose' ? 'alert_on_missed_dose' : 'alert_on_critical_glucose';
    await notifyCaregivers(patientId, row, { onlyFlag: flag });
    await db('clinical_alerts').where({ id: row.id }).update({ notified_caregiver: true });
  }
  return row;
}

/** Đánh giá cờ đỏ đường huyết cho 1 bệnh nhân sau mỗi lần nhập chỉ số. */
async function evaluateAndQueueAlerts(patientId) {
  try {
    const since = new Date(Date.now() - 72 * 3600000).toISOString();
    const glucose = await db('metrics')
      .where({ user_id: patientId, measurement_category: 'glucose' })
      .andWhere('measured_at', '>=', since)
      .orderBy('measured_at', 'desc');

    const today = new Date().toISOString().slice(0, 10);
    const hypo = glucose.find((g) => Number(g.value) < CLINIC_THRESHOLDS.HYPO);
    const hyper = glucose.find((g) => Number(g.value) > CLINIC_THRESHOLDS.SEVERE_HYPER);

    if (hypo) {
      await queue(patientId, {
        type: 'hypo',
        severity: 'critical',
        title: `Hạ đường huyết ${hypo.value} mmol/L`,
        detail: `Đo lúc ${hypo.measured_at}. Ngưỡng an toàn ≥ ${CLINIC_THRESHOLDS.HYPO} mmol/L.`,
        dedupe_key: `hypo:${today}`,
      });
    }
    if (hyper) {
      await queue(patientId, {
        type: 'severe_hyper',
        severity: 'critical',
        title: `Tăng đường huyết nặng ${hyper.value} mmol/L`,
        detail: `Đo lúc ${hyper.measured_at}. Nguy cơ nhiễm toan ceton nếu ≥ ${CLINIC_THRESHOLDS.SEVERE_HYPER} kéo dài.`,
        dedupe_key: `hyper:${today}`,
      });
    }
  } catch (e) {
    logger.error(`[Alert] evaluate lỗi cho user ${patientId}: ${e.message}`);
  }
}

module.exports = { queue, evaluateAndQueueAlerts };
