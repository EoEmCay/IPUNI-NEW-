'use strict';
const axios = require('axios');
const logger = require('../utils/logger');

// ============================================================================
// KÊNH CẢNH BÁO KHẨN (SMS / Zalo ZNS / …) — NHANH HƠN EMAIL:
// Email không phải kênh phản xạ nhanh với người Việt (con cái đi làm hiếm khi check email
// tức thì). Hầu hết nhà cung cấp SMS/Zalo ZNS tại VN (eSMS, SpeedSMS, FPT SMS Brandname,
// hoặc Zalo ZNS qua 1 webhook trung gian) đều expose 1 REST endpoint dạng POST JSON đơn giản
// - nên module này định nghĩa 1 lớp trừu tượng CHUNG gọi vào ĐÚNG 1 webhook cấu hình qua env,
// thay vì hard-code riêng cho 1 hãng cụ thể. Khi CHƯA cấu hình (mặc định hiện tại), luôn
// no-op AN TOÀN — không throw, không làm gãy luồng gửi email chính đang hoạt động.
//
// Để bật thật: set URGENT_CHANNEL_WEBHOOK_URL (+ URGENT_CHANNEL_WEBHOOK_TOKEN nếu provider
// yêu cầu Bearer token) trỏ tới endpoint gửi SMS/ZNS thật của nhà cung cấp đã chọn — không
// cần sửa thêm dòng code nào khác, caregiverNotify.js đã gọi sẵn hàm này.
// ============================================================================
const WEBHOOK_URL = process.env.URGENT_CHANNEL_WEBHOOK_URL || '';
const WEBHOOK_TOKEN = process.env.URGENT_CHANNEL_WEBHOOK_TOKEN || '';

function isConfigured() {
  return Boolean(WEBHOOK_URL);
}

/**
 * Gửi 1 cảnh báo khẩn qua kênh nhanh (SMS/Zalo ZNS...). Luôn trả về, không bao giờ throw -
 * gọi nơi khác không cần try/catch bọc thêm.
 * @param {{ phone: string, message: string }} payload
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
async function sendUrgentAlert({ phone, message }) {
  if (!phone) return { sent: false, reason: 'no_phone' };
  if (!isConfigured()) {
    logger.info('[UrgentChannel] Chưa cấu hình URGENT_CHANNEL_WEBHOOK_URL — chỉ gửi email.');
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await axios.post(
      WEBHOOK_URL,
      { phone, message },
      { timeout: 8000, headers: WEBHOOK_TOKEN ? { Authorization: `Bearer ${WEBHOOK_TOKEN}` } : {} },
    );
    return { sent: true };
  } catch (e) {
    logger.warn(`[UrgentChannel] Gửi thất bại tới ${phone}: ${e.message}`);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = { sendUrgentAlert, isConfigured };
