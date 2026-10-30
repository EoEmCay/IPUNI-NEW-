'use strict';
const db = require('../config/database');
const logger = require('../utils/logger');

const EVENT = Object.freeze({
  REMINDER_SENT: 'reminder_sent',
  DOSE_CONFIRMED: 'dose_confirmed',
  CAREGIVER_ALERT_SENT: 'caregiver_alert_sent',
  CAREGIVER_ALERT_ACKED: 'caregiver_alert_acked',
});

/**
 * Ghi 1 sự kiện. KHÔNG BAO GIỜ throw: đo đạc hỏng không được làm hỏng việc nhắc thuốc.
 * Không lưu tên thuốc, nội dung tin hay SĐT - chỉ id, kênh, trạng thái.
 */
async function record({ type, userId, actorId, medicationId, alertId, scheduledFor, channel, status = 'ok', meta }) {
  try {
    await db('care_events').insert({
      event_type: type,
      user_id: userId || null,
      actor_id: actorId || null,
      medication_id: medicationId || null,
      alert_id: alertId || null,
      scheduled_for: scheduledFor || null,
      channel: channel || null,
      status,
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch (e) {
    logger.warn(`[CareEvents] Không ghi được sự kiện ${type}: ${e.message}`);
  }
}

/**
 * Ghi kết quả của 1 lần gửi ({sent, reason} từ telegram/zns/urgentChannel).
 * Kênh chưa cấu hình hoặc thiếu SĐT là "không gửi", không phải "gửi lỗi" nên bỏ qua.
 */
async function recordSend(type, base, result) {
  if (!result) return;
  if (!result.sent && (result.reason === 'not_configured' || result.reason === 'no_phone')) return;
  await record({
    ...base,
    type,
    status: result.sent ? 'ok' : 'failed',
    meta: { ...(base.meta || {}), ...(result.sent ? {} : { reason: result.reason || 'unknown' }) },
  });
}

function median(nums) {
  if (!nums.length) return null;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : null);

/** Phễu 4 sự kiện cốt lõi trong N ngày gần nhất (cho trang quản trị). */
async function getFunnel(days = 14) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  const rows = await db('care_events')
    .where('created_at', '>=', since)
    .select('event_type', 'channel', 'status', 'alert_id', 'meta');

  const byType = {};
  const byChannel = {};
  const alertsSent = new Set();
  const alertsAcked = new Set();
  const delays = [];
  let lateConfirms = 0;

  for (const r of rows) {
    const key = `${r.event_type}:${r.status}`;
    byType[key] = (byType[key] || 0) + 1;
    if (r.channel) {
      const ck = `${r.event_type}:${r.channel}:${r.status}`;
      byChannel[ck] = (byChannel[ck] || 0) + 1;
    }
    if (r.event_type === EVENT.CAREGIVER_ALERT_SENT && r.status === 'ok' && r.alert_id) alertsSent.add(r.alert_id);
    if (r.event_type === EVENT.CAREGIVER_ALERT_ACKED && r.alert_id) alertsAcked.add(r.alert_id);
    if (r.event_type === EVENT.DOSE_CONFIRMED && r.meta) {
      try {
        const m = JSON.parse(r.meta);
        if (typeof m.delay_minutes === 'number') delays.push(m.delay_minutes);
        if (m.late) lateConfirms++;
      } catch { /* meta hỏng thì bỏ qua */ }
    }
  }

  const n = (type, status = 'ok') => byType[`${type}:${status}`] || 0;
  const tgSent = byChannel[`${EVENT.REMINDER_SENT}:telegram:ok`] || 0;
  const tgConfirmed = byChannel[`${EVENT.DOSE_CONFIRMED}:telegram:ok`] || 0;

  return {
    days,
    reminders: { sent: n(EVENT.REMINDER_SENT), failed: n(EVENT.REMINDER_SENT, 'failed') },
    doses: {
      confirmed: n(EVENT.DOSE_CONFIRMED),
      confirmedLate: lateConfirms,
      medianDelayMinutes: median(delays),
      telegramConfirmRatePct: pct(tgConfirmed, tgSent), // xác nhận qua Telegram / nhắc Telegram đã gửi
    },
    caregiverAlerts: {
      sent: n(EVENT.CAREGIVER_ALERT_SENT),
      failed: n(EVENT.CAREGIVER_ALERT_SENT, 'failed'),
      distinctAlertsSent: alertsSent.size,
      distinctAlertsAcked: alertsAcked.size,
      ackRatePct: pct(alertsAcked.size, alertsSent.size),
    },
    byChannel,
    note: 'ackRate = số cảnh báo có người nhà bấm "Đã biết" / số cảnh báo đã gửi. Nhắc trong app (chuông máy) chưa đo được từ server.',
  };
}

module.exports = { EVENT, record, recordSend, getFunnel };
