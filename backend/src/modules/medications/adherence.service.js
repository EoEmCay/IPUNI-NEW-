'use strict';
const db = require('../../config/database');
const sched = require('./medicationSchedule');
const events = require('../../services/careEvents.service');
const memoryCache = require('../../utils/memoryCache');

const ALLOWED_STATUS = new Set(['taken', 'missed', 'skipped', 'late']);

async function getActiveMeds(userId) {
  const rows = await db('medications')
    .where({ user_id: userId, is_active: 1 });
  return rows.map((r) => ({
    ...r,
    times: sched.safeJsonArray(r.times),
    slots: sched.safeJsonArray(r.slots),
    days_of_week: sched.safeJsonArray(r.days_of_week),
  }));
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

  // Lấy các log đã uống trong cửa sổ: status in ('taken', 'late')
  const logs = await db('medication_logs')
    .where({ user_id: userId })
    .whereIn('status', ['taken', 'late'])
    .where('scheduled_for', '>=', from.toISOString())
    .where('scheduled_for', '<=', now.toISOString());

  const taken = logs.length;
  const score = expected === 0 ? 100 : Math.min(100, Math.round((taken / expected) * 100));

  // Phân rã theo từng thuốc
  const takenByMed = new Map();
  for (const l of logs) {
    takenByMed.set(l.medication_id, (takenByMed.get(l.medication_id) || 0) + 1);
  }

  const breakdown = perMed.map((p) => {
    const t = takenByMed.get(p.medicationId) || 0;
    const medScore = p.expected === 0 ? 100 : Math.min(100, Math.round((t / p.expected) * 100));
    return { ...p, taken: t, score: medScore };
  });

  return {
    windowDays,
    score,
    expectedDoses: expected,
    takenDoses: taken,
    breakdown,
  };
}

/**
 * Ghi nhận một cữ thuốc:
 * - Upsert theo (user_id, medication_id, scheduled_for) để người dùng bấm lại không bị trùng.
 * - Delay minutes tự động tính nếu status === 'taken' mà lệch > 15 phút.
 * - Phát sự kiện DOSE_CONFIRMED (để Family Alarm huỷ chuông báo).
 */
async function logDose(userId, medicationId, { scheduledFor, status = 'taken', reason = null, source = 'patient', takenAt = null }, ctx = {}) {
  if (!ALLOWED_STATUS.has(status)) {
    throw Object.assign(new Error(`Trạng thái không hợp lệ: ${status}`), { status: 400 });
  }

  const med = await db('medications')
    .where({ id: medicationId, user_id: userId, is_active: 1 })
    .first();
  if (!med) {
    throw Object.assign(new Error('Thuốc không tồn tại hoặc đã ngừng'), { status: 404 });
  }

  const schedDate = new Date(scheduledFor);
  if (Number.isNaN(schedDate.getTime())) {
    throw Object.assign(new Error('scheduledFor không hợp lệ'), { status: 400 });
  }

  // Tự suy slot_time dạng HH:MM theo giờ VN từ scheduled_for
  const vn = sched.vnParts(schedDate);
  const slotTime = `${String(vn.hh).padStart(2, '0')}:${String(vn.mm).padStart(2, '0')}`;

  const finalTakenAt = status === 'taken'
    ? (takenAt ? new Date(takenAt) : new Date())
    : null;

  let delayMin = 0;
  if (finalTakenAt) {
    delayMin = Math.round((finalTakenAt.getTime() - schedDate.getTime()) / 60000);
  }

  const row = {
    user_id: userId,
    medication_id: medicationId,
    scheduled_for: schedDate.toISOString(),
    slot_time: slotTime,
    status,
    taken_at: finalTakenAt ? finalTakenAt.toISOString() : null,
    delay_minutes: delayMin,
    reason: reason || null,
  };

  // Tra cứu xem trước đó cữ này đã được đánh dấu chưa
  const previous = await db('medication_logs')
    .where({ user_id: userId, medication_id: medicationId, scheduled_for: row.scheduled_for })
    .first();

  await db('medication_logs')
    .insert(row)
    .onConflict(['medication_id', 'scheduled_for'])
    .merge({
      status: row.status,
      taken_at: row.taken_at,
      delay_minutes: row.delay_minutes,
      reason: row.reason,
      source: 'patient',
    });

  // Xóa cache để timeline và dashboard cập nhật tức thì
  memoryCache.delPrefix(`care:timeline:${userId}:`);
  memoryCache.del(`meds:today:${userId}`);

  // Đo sự kiện "liều đã xác nhận": chỉ lần đầu (bấm lại cùng một cữ không tính thêm).
  if (status === 'taken' && !(previous && previous.status === 'taken')) {
    await events.record({
      type: events.EVENT.DOSE_CONFIRMED,
      userId,
      actorId: ctx.actorId && ctx.actorId !== userId ? ctx.actorId : null,
      medicationId,
      scheduledFor: row.scheduled_for,
      channel: ctx.channel || 'app',
      meta: { delay_minutes: delayMin, late: Boolean(previous && previous.status === 'missed') },
    });
  }

  return row;
}

/**
 * Lịch sử uống thuốc gần đây (cho trang cá nhân & báo cáo bác sĩ).
 */
async function getLogs(userId, days = 30) {
  const from = new Date(Date.now() - days * 86400000);
  return db('medication_logs as l')
    .join('medications as m', 'm.id', 'l.medication_id')
    .where('l.user_id', userId)
    .where('l.scheduled_for', '>=', from.toISOString())
    .select(
      'l.id',
      'l.medication_id',
      'm.name as medication_name',
      'm.dosage',
      'l.scheduled_for',
      'l.slot_time',
      'l.status',
      'l.taken_at',
      'l.delay_minutes',
      'l.reason',
      'l.created_at'
    )
    .orderBy('l.scheduled_for', 'desc');
}

/**
 * Danh sách cữ uống dự kiến trong tương lai (cho chuông báo native & push notification).
 */
async function getUpcomingDoses(userId, windowDays = 14) {
  const now = new Date();
  const to = new Date(now.getTime() + windowDays * 86400000);

  const meds = await getActiveMeds(userId);
  const doses = [];
  for (const med of meds) {
    if (med.schedule_type === 'as_needed') continue;
    for (const d of sched.enumerateDoses(med, now, to)) {
      doses.push({
        medicationId: med.id,
        name: med.name,
        dosage: med.dosage,
        instructions: med.instructions,
        image_url: med.image_url,
        scheduledFor: d.scheduledFor,
        slotTime: d.slotTime,
      });
    }
  }

  doses.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  return doses;
}

module.exports = {
  computeAdherence,
  logDose,
  getLogs,
  getUpcomingDoses,
};
