'use strict';
const db = require('../../config/database');
const sched = require('./medicationSchedule');

const POOR_ADHERENCE_THRESHOLD = 0.75; // < 75% = kém (PDC nghiêm hơn dùng 0.80)

async function getActiveMeds(userId) {
  return db('medications')
    .where({ user_id: userId })
    .andWhere((q) => q.where('is_active', 1).orWhereNull('is_active'));
}

/**
 * Điểm tuân thủ trong cửa sổ N ngày:
 *   adherence = số liều ĐÃ UỐNG / số liều KỲ VỌNG   (chỉ thuốc có lịch cố định)
 */
async function computeAdherence(userId, windowDays = 30) {
  const now = new Date();
  const from = new Date(now.getTime() - windowDays * 86400000);

  const meds = await getActiveMeds(userId);

  let expected = 0;
  const perMed = [];
  for (const med of meds) {
    if (med.schedule_type === 'as_needed') continue;
    const doses = sched.enumerateDoses(med, from, now);
    expected += doses.length;
    perMed.push({ medicationId: med.id, name: med.name, expected: doses.length });
  }

  const takenRows = await db('medication_logs')
    .where({ user_id: userId, status: 'taken' })
    .andWhere('scheduled_for', '>=', from.toISOString())
    .andWhere('scheduled_for', '<=', now.toISOString())
    .select('medication_id')
    .count('* as c')
    .groupBy('medication_id');
  const takenMap = Object.fromEntries(takenRows.map((r) => [r.medication_id, Number(r.c)]));

  let taken = 0;
  for (const pm of perMed) {
    pm.taken = Math.min(takenMap[pm.medicationId] || 0, pm.expected);
    pm.rate = pm.expected ? +(pm.taken / pm.expected).toFixed(3) : null;
    taken += pm.taken;
  }

  const missed = await db('medication_logs')
    .where({ user_id: userId, status: 'missed' })
    .andWhere('scheduled_for', '>=', from.toISOString())
    .count('* as c')
    .first();

  const rate = expected ? +(taken / expected).toFixed(3) : null;
  return {
    windowDays,
    expectedDoses: expected,
    takenDoses: taken,
    missedDoses: Number((missed && missed.c) || 0),
    adherenceRate: rate,
    adherencePercent: rate == null ? null : Math.round(rate * 100),
    isPoorAdherence: rate != null && rate < POOR_ADHERENCE_THRESHOLD,
    perMedication: perMed,
  };
}

/**
 * Ghi nhận 1 liều. Idempotent theo (medication_id, scheduled_for).
 * Nếu FE không gửi scheduledFor -> suy ra liều theo lịch gần "bây giờ" nhất (±12h).
 */
async function logDose(userId, medicationId, { status = 'taken', scheduledFor, takenAt } = {}) {
  if (!['taken', 'skipped', 'missed'].includes(status)) {
    throw { status: 400, message: 'Trạng thái không hợp lệ' };
  }
  const med = await db('medications').where({ id: medicationId, user_id: userId }).first();
  if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };

  const now = new Date();
  let scheduledInstant = scheduledFor ? new Date(scheduledFor) : null;

  if (!scheduledInstant || isNaN(scheduledInstant.getTime())) {
    const cands = sched.enumerateDoses(
      med,
      new Date(now.getTime() - 12 * 3600000),
      new Date(now.getTime() + 12 * 3600000),
    );
    if (cands.length) {
      scheduledInstant = cands.reduce((best, c) =>
        Math.abs(c.instant - now) < Math.abs(best.instant - now) ? c : best,
      ).instant;
    } else {
      scheduledInstant = now;
    }
  }

  const p = sched.vnParts(scheduledInstant);
  const slot = `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
  const takenInstant = status === 'taken' ? (takenAt ? new Date(takenAt) : now) : null;
  const delay = takenInstant ? Math.round((takenInstant - scheduledInstant) / 60000) : null;

  const row = {
    user_id: userId,
    medication_id: medicationId,
    scheduled_for: scheduledInstant.toISOString(),
    slot_time: slot,
    status,
    taken_at: takenInstant ? takenInstant.toISOString() : null,
    delay_minutes: delay,
    source: 'patient',
  };

  await db('medication_logs')
    .insert(row)
    .onConflict(['medication_id', 'scheduled_for'])
    .merge({
      status: row.status,
      taken_at: row.taken_at,
      delay_minutes: row.delay_minutes,
      source: 'patient',
    });

  return db('medication_logs')
    .where({ medication_id: medicationId, scheduled_for: row.scheduled_for })
    .first();
}

/** Lịch sử liều để hiển thị + xuất báo cáo. */
async function getDoseHistory(userId, days = 30) {
  const from = new Date(Date.now() - days * 86400000).toISOString();
  return db('medication_logs as l')
    .leftJoin('medications as m', 'l.medication_id', 'm.id')
    .where('l.user_id', userId)
    .andWhere('l.scheduled_for', '>=', from)
    .orderBy('l.scheduled_for', 'desc')
    .select('l.*', 'm.name as medication_name', 'm.dosage');
}

module.exports = { computeAdherence, logDose, getDoseHistory, POOR_ADHERENCE_THRESHOLD };
