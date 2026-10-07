'use strict';
const db = require('../config/database');
const sched = require('../modules/medications/medicationSchedule');
const adherence = require('../modules/medications/adherence.service');
const { publish } = require('../realtime/eventBus');
const tg = require('../services/telegram.service');
const logger = require('../utils/logger');

// Nhận tin từ Telegram bằng long polling (không cần webhook/HTTPS riêng).
// ponytail: polling chỉ đúng khi chạy 1 instance backend; scale nhiều instance thì chuyển sang setWebhook.

async function handleStart(chatId, param) {
  const userId = tg.parseStartToken(param);
  if (!userId) {
    return tg.sendMessage(chatId, 'Xin chào! Để nhận nhắc uống thuốc, vào ứng dụng DIA+ → Cài đặt → <b>Kết nối Telegram</b>.');
  }
  const user = await db('users').where({ id: userId }).first();
  if (!user) return tg.sendMessage(chatId, 'Không tìm thấy tài khoản DIA+. Vui lòng tạo lại liên kết trong ứng dụng.');
  // 1 chat Telegram chỉ gắn với 1 tài khoản
  await db('users').where({ telegram_chat_id: String(chatId) }).whereNot({ id: userId }).update({ telegram_chat_id: null });
  await db('users').where({ id: userId }).update({ telegram_chat_id: String(chatId) });
  return tg.sendMessage(chatId,
    `✅ Đã kết nối DIA+ với tài khoản <b>${tg.escapeHtml(user.name || user.user_code || '')}</b>.\n\n` +
    'Bạn sẽ nhận tin nhắc khi đến giờ uống thuốc, và cảnh báo khi người trong gia đình quên uống thuốc.\n' +
    'Gõ /stop để ngừng nhận tin.');
}

async function handleStop(chatId) {
  await db('users').where({ telegram_chat_id: String(chatId) }).update({ telegram_chat_id: null });
  return tg.sendMessage(chatId, 'Đã ngừng nhận tin từ DIA+. Kết nối lại trong ứng dụng khi cần.');
}

// Nút "Đã uống": ghi nhận mọi thuốc của người dùng có cữ đúng mốc giờ đó.
async function handleTaken(query, epochSec) {
  const chatId = query.message.chat.id;
  const user = await db('users').where({ telegram_chat_id: String(chatId) }).first();
  if (!user) return tg.call('answerCallbackQuery', { callback_query_id: query.id, text: 'Tài khoản chưa kết nối.' });

  const instant = new Date(epochSec * 1000);
  const meds = await db('medications').where({ user_id: user.id });
  let count = 0;
  for (const med of meds) {
    const hit = sched.enumerateDoses(med, new Date(instant.getTime() - 60000), new Date(instant.getTime() + 60000))
      .some((d) => d.instant.getTime() === instant.getTime());
    if (!hit) continue;
    const log = await adherence.logDose(user.id, med.id, { status: 'taken', scheduledFor: instant.toISOString() });
    publish('patient.medication_logged', { patientId: user.id, log });
    count++;
  }
  await tg.call('answerCallbackQuery', { callback_query_id: query.id, text: count ? 'Đã ghi nhận ✅' : 'Không tìm thấy cữ thuốc này.' });
  if (count) {
    const p = sched.vnParts(new Date());
    const at = `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
    await tg.call('editMessageText', { chat_id: chatId, message_id: query.message.message_id, text: `${query.message.text}\n\n✅ Đã uống lúc ${at}` });
  }
}

async function handleUpdate(update) {
  if (update.message && typeof update.message.text === 'string') {
    const chatId = update.message.chat.id;
    const [cmd, param] = update.message.text.trim().split(/\s+/);
    if (cmd === '/start') return handleStart(chatId, param);
    if (cmd === '/stop') return handleStop(chatId);
    return tg.sendMessage(chatId, 'DIA+ sẽ tự nhắn khi đến giờ uống thuốc. Gõ /stop để ngừng nhận tin.');
  }
  if (update.callback_query) {
    const m = /^t:(\d+)$/.exec(update.callback_query.data || '');
    if (m) return handleTaken(update.callback_query, Number(m[1]));
  }
  return null;
}

function startTelegramBot() {
  if (!tg.isConfigured()) return false;
  let offset = 0;
  let stopped = false;
  (async () => {
    await tg.call('deleteWebhook', {}).catch(() => {});
    while (!stopped) {
      try {
        const updates = await tg.call('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] }, 40000);
        for (const u of updates) {
          offset = u.update_id + 1;
          await handleUpdate(u).catch((e) => logger.error(`[TelegramBot] Xử lý update lỗi: ${e.message}`, e));
        }
      } catch (e) {
        logger.warn(`[TelegramBot] getUpdates lỗi: ${e.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
  logger.info('[TelegramBot] Đang nhận tin từ Telegram (long polling)');
  return () => { stopped = true; };
}

module.exports = { startTelegramBot, handleUpdate };
