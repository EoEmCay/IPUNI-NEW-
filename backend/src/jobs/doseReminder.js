'use strict';
const db = require('../config/database');
const sched = require('../modules/medications/medicationSchedule');
const zns = require('../services/zns.service');
const tg = require('../services/telegram.service');
const logger = require('../utils/logger');

// Nhắc uống thuốc ngoài app đúng giờ cữ: Telegram (người dùng đã kết nối bot) và Zalo ZNS
// (đã bật `zalo_reminders` + có SĐT). Nhiều thuốc cùng giờ -> 1 tin. Cữ đã ghi uống sớm thì không nhắc.
// ponytail: chỉ xét cữ trong 5 phút vừa qua - server khởi động lại đúng lúc đó sẽ bỏ lỡ 1 lượt
// nhắc ngoài app (nhắc trong app vẫn chạy); cần chắc chắn thì lưu bảng "đã gửi" và quét rộng hơn.
const INTERVAL_MIN = 5;

function telegramText(instant, meds) {
  const { buoi, gio } = zns.doseTimeParams(instant);
  const lines = meds.map((m) => `• <b>${tg.escapeHtml(m.name)}</b>${m.dosage ? ` ${tg.escapeHtml(m.dosage)}` : ''}` +
    (m.instructions ? `\n   <i>${tg.escapeHtml(m.instructions)}</i>` : ''));
  return `💊 Đến giờ uống thuốc buổi ${buoi} (${gio}):\n\n${lines.join('\n')}\n\nUống xong bấm nút bên dưới nhé.`;
}

async function runDoseReminder(now = new Date()) {
  const useTg = tg.isConfigured();
  const useZns = zns.isConfigured('doseReminder');
  if (!useTg && !useZns) return;
  const from = new Date(now.getTime() - INTERVAL_MIN * 60000);

  const users = await db('users').where((q) => {
    if (useTg) q.orWhereNotNull('telegram_chat_id');
    if (useZns) q.orWhere((w) => w.where({ zalo_reminders: true }).whereNotNull('phone'));
  });
  for (const user of users) {
    const meds = await db('medications')
      .where({ user_id: user.id })
      .andWhere((q) => q.where('is_active', 1).orWhereNull('is_active'))
      .andWhere((q) => q.whereNot('schedule_type', 'as_needed').orWhereNull('schedule_type'));

    const due = new Map(); // instant ISO -> thuốc chưa uống ở cữ đó
    for (const med of meds) {
      for (const dose of sched.enumerateDoses(med, from, now)) {
        if (dose.instant <= from) continue;
        const iso = dose.instant.toISOString();
        const logged = await db('medication_logs').where({ medication_id: med.id, scheduled_for: iso }).first();
        if (!logged) due.set(iso, [...(due.get(iso) || []), med]);
      }
    }

    for (const [iso, dueMeds] of due) {
      const instant = new Date(iso);
      if (useTg && user.telegram_chat_id) {
        await tg.sendMessage(user.telegram_chat_id, telegramText(instant, dueMeds), {
          buttons: [{ text: '✅ Đã uống', data: `t:${instant.getTime() / 1000}` }],
        });
      }
      if (useZns && user.zalo_reminders && user.phone) {
        await zns.sendZns({
          template: 'doseReminder',
          phone: user.phone,
          data: { ten_khach_hang: user.name || 'Quý khách', ma_khach_hang: user.user_code || String(user.id), ...zns.doseTimeParams(instant) },
          requestId: `dose${user.id}-${iso}`,
        });
      }
    }
  }
}

// Mỗi sáng 08:00 (giờ VN): đơn nào còn đúng 3 ngày nữa hết thuốc -> nhắn Telegram nhắc tái khám/mua thêm.
// Đơn = thuốc cùng bác sĩ + cùng ngày kê (giống cách Tủ thuốc gom). Ngày hết = end_date muộn nhất;
// đơn còn thuốc chưa có end_date thì không nhắc.
const LOW_SUPPLY_DAYS = 3;
const LOW_SUPPLY_HOUR = 8;

async function runLowSupplyReminder(now = new Date()) {
  if (!tg.isConfigured()) return;
  // Chỉ chạy ở lượt job có chứa mốc 08:00 VN (job chạy 5 phút/lần -> đúng 1 lượt mỗi ngày).
  const p = sched.vnParts(now);
  if (p.hh !== LOW_SUPPLY_HOUR || p.mm >= INTERVAL_MIN) return;

  const today = sched.parseYmd(sched.vnDateStr(now));
  const users = await db('users').whereNotNull('telegram_chat_id');
  for (const user of users) {
    const meds = await db('medications').where({ user_id: user.id })
      .andWhere((q) => q.where('is_active', 1).orWhereNull('is_active'));
    const groups = {};
    for (const m of meds) {
      const key = `${m.doctor_name || ''}_${String(m.prescribed_at || m.created_at || '').slice(0, 10)}`;
      (groups[key] ||= []).push(m);
    }
    for (const group of Object.values(groups)) {
      if (!group.every((m) => m.end_date)) continue;
      const end = group.map((m) => String(m.end_date).slice(0, 10)).sort().at(-1);
      const endYmd = sched.parseYmd(end);
      if (!endYmd || sched.dayDiff(today, endYmd) !== LOW_SUPPLY_DAYS) continue;
      const [y, mo, d] = end.split('-');
      const first = group[0];
      const from = first.prescribed_at ? ` ngày ${String(first.prescribed_at).slice(0, 10).split('-').reverse().join('/')}` : '';
      await tg.sendMessage(user.telegram_chat_id,
        `📦 Còn ${LOW_SUPPLY_DAYS} ngày nữa (đến ${d}/${mo}/${y}) là hết thuốc của đơn${from}` +
        `${first.doctor_name ? ` - ${tg.escapeHtml(first.doctor_name)}` : ''}:\n` +
        group.map((m) => `• ${tg.escapeHtml(m.name)}`).join('\n') +
        '\n\nNhớ đi tái khám hoặc mua thêm thuốc để không bị gián đoạn.');
    }
  }
}

function startDoseReminderJob() {
  const run = () => {
    runDoseReminder().catch((e) => logger.error(`[DoseReminder] ${e.message}`, e));
    runLowSupplyReminder().catch((e) => logger.error(`[LowSupply] ${e.message}`, e));
  };
  run();
  const timer = setInterval(run, INTERVAL_MIN * 60 * 1000);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { startDoseReminderJob, runDoseReminder, runLowSupplyReminder, telegramText };
