'use strict';
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../config/constants');

// ============================================================================
// TELEGRAM BOT - nhắc uống thuốc + cảnh báo người nhà. Miễn phí, không cần giấy phép/duyệt mẫu.
// Cần: TELEGRAM_BOT_TOKEN (từ @BotFather) + TELEGRAM_BOT_USERNAME (tên bot, không có @).
// Thiếu thì mọi hàm tự no-op. Bot chỉ nhắn được cho người đã bấm Start -> kết nối qua link
// t.me/<bot>?start=<mã> do app tạo (mã ký HMAC, không đoán được user khác).
// ============================================================================
const token = () => process.env.TELEGRAM_BOT_TOKEN;

function isConfigured() {
  return Boolean(token() && process.env.TELEGRAM_BOT_USERNAME);
}

async function call(method, body, timeout = 10000) {
  const res = await axios.post(`https://api.telegram.org/bot${token()}/${method}`, body, { timeout });
  return res.data.result;
}

const sign = (userId) => crypto.createHmac('sha256', JWT_SECRET).update(`tg:${userId}`).digest('hex').slice(0, 20);

// Tham số start của Telegram chỉ nhận [A-Za-z0-9_-], tối đa 64 ký tự.
function linkUrl(userId) {
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${userId}_${sign(userId)}`;
}

/** "12_ab12..." -> 12, sai chữ ký -> null */
function parseStartToken(startParam) {
  const m = /^(\d+)_([0-9a-f]{20})$/.exec(startParam || '');
  if (!m) return null;
  const expected = sign(m[1]);
  return crypto.timingSafeEqual(Buffer.from(m[2]), Buffer.from(expected)) ? Number(m[1]) : null;
}

/**
 * Gửi tin. Không bao giờ throw.
 * @param {string} chatId
 * @param {string} text  HTML đơn giản (<b>, <i>) - nhớ escapeHtml dữ liệu người dùng nhập
 * @param {{ buttons?: Array<{ text: string, data: string }> }} opts  nút bấm callback (mỗi nút 1 hàng)
 */
async function sendMessage(chatId, text, { buttons } = {}) {
  if (!isConfigured() || !chatId) return { sent: false, reason: 'not_configured' };
  try {
    await call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(buttons ? { reply_markup: { inline_keyboard: buttons.map((b) => [{ text: b.text, callback_data: b.data }]) } } : {}),
    });
    return { sent: true };
  } catch (e) {
    logger.warn(`[Telegram] Gửi thất bại tới chat ${chatId}: ${(e.response && e.response.data && e.response.data.description) || e.message}`);
    return { sent: false, reason: 'send_failed' };
  }
}

const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

module.exports = { isConfigured, call, linkUrl, parseStartToken, sendMessage, escapeHtml };
