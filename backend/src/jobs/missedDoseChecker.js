'use strict';
const db = require('../config/database');
const sched = require('../modules/medications/medicationSchedule');
const { queue } = require('../modules/alerts/alert.service');
const { publish } = require('../realtime/eventBus');
const logger = require('../utils/logger');

// "Quên" khi quá giờ > 15 phút — khớp với kịch bản nhắc 2 lần đã trình bày với BGK: Lần 1 nhắc
// đúng giờ, Lần 2 nhắc lại sau 15 phút nếu chưa xác nhận; nếu qua mốc này vẫn chưa phản hồi thì
// coi là "bỏ quên" và bắt đầu báo người thân. Job chạy mỗi 5 phút (xem startMissedDoseJob bên
// dưới) nên độ trễ thực tế tối đa tới lúc báo là ~15-20 phút sau giờ uống, đúng như đã cam kết.
const GRACE_MINUTES = 15;
const LOOKBACK_HOURS = 12; // chỉ xét liều trong 12h gần nhất
const MAX_OVERDUE_HOURS = 24; // ngừng cảnh báo sau 24h (coi như bỏ liều)

async function runMissedDoseCheck() {
  const now = new Date();
  const from = new Date(now.getTime() - LOOKBACK_HOURS * 3600000);

  const meds = await db('medications')
    .where((q) => q.where('is_active', 1).orWhereNull('is_active'))
    .andWhere((q) => q.whereNot('schedule_type', 'as_needed').orWhereNull('schedule_type'));

  for (const med of meds) {
    const doses = sched.enumerateDoses(med, from, now);
    for (const dose of doses) {
      const overdueMin = Math.round((now - dose.instant) / 60000);
      if (overdueMin <= GRACE_MINUTES || overdueMin > MAX_OVERDUE_HOURS * 60) continue;

      const existing = await db('medication_logs')
        .where({ medication_id: med.id, scheduled_for: dose.instant.toISOString() })
        .first();
      if (existing) continue;

      await db('medication_logs')
        .insert({
          user_id: med.user_id,
          medication_id: med.id,
          scheduled_for: dose.instant.toISOString(),
          slot_time: dose.slot,
          status: 'missed',
          source: 'auto_missed',
        })
        .onConflict(['medication_id', 'scheduled_for'])
        .ignore();

      const ymd = sched.vnDateStr(dose.instant);
      const alert = {
        type: 'missed_dose',
        severity: 'warning',
        title: `Quên uống ${med.name}`,
        detail: `Cữ ${dose.slot} ngày ${ymd} — đã quá ${overdueMin} phút.`,
        dedupe_key: `missed:${med.id}:${dose.instant.toISOString()}`,
      };
      await queue(med.user_id, alert);
      publish('patient.medication_logged', {
        patientId: med.user_id,
        log: { medication_id: med.id, status: 'missed', slot_time: dose.slot },
      });
    }
  }
}

function startMissedDoseJob() {
  runMissedDoseCheck().catch((e) => logger.error(`[MissedDose] ${e.message}`, e));
  const timer = setInterval(() => {
    runMissedDoseCheck().catch((e) => logger.error(`[MissedDose] ${e.message}`, e));
  }, 5 * 60 * 1000);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { startMissedDoseJob, runMissedDoseCheck };
