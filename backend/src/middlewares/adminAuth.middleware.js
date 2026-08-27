const crypto = require('crypto');
const { sendError } = require('../utils/response.helper');
const { ADMIN_DASHBOARD_KEY } = require('../config/constants');

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Bảo vệ các endpoint Admin Dashboard bằng key bí mật.
 * Key CHỈ nhận qua header `X-Admin-Key` — KHÔNG nhận qua query để tránh lộ vào log/URL.
 */
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!ADMIN_DASHBOARD_KEY || !key || !safeEqual(key, ADMIN_DASHBOARD_KEY)) {
    return sendError(res, 'Sai key quản trị hoặc chưa cung cấp key', 401);
  }
  next();
}

module.exports = { adminAuth };
