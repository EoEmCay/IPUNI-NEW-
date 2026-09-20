const crypto = require('crypto');
const { sendError } = require('../utils/response.helper');
const { CRON_SECRET } = require('../config/constants');

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Bảo vệ các endpoint kích hoạt job định kỳ (vd kiểm tra bỏ thuốc) bằng key bí mật riêng,
 * để 1 scheduler NGOÀI process Node (Render Cron Job, GitHub Actions cron, v.v.) có thể gọi
 * vào đánh thức job mà không cần JWT người dùng thật - job này không gắn với 1 người dùng cụ
 * thể nào. Key CHỈ nhận qua header (không qua query) để tránh lộ vào access log/URL.
 */
function cronAuth(req, res, next) {
  const key = req.headers['x-cron-secret'];
  if (!CRON_SECRET || !key || !safeEqual(key, CRON_SECRET)) {
    return sendError(res, 'Sai hoặc thiếu X-Cron-Secret', 401);
  }
  next();
}

module.exports = { cronAuth };
