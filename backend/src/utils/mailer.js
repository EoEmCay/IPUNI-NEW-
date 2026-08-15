const nodemailer = require('nodemailer');
const logger = require('./logger');

// Nơi duy nhất khởi tạo transporter gửi mail cho toàn bộ app - trước đây otp.service.js
// và auth.service.js mỗi nơi tự dựng transporter Gmail riêng (3 chỗ trùng lặp).
//
// Ưu tiên Resend (dịch vụ email giao dịch, domain riêng diaplus.vn, không phụ thuộc 1
// Gmail cá nhân dễ bị Google tự động chặn/giới hạn khi gửi tự động số lượng lớn). Nếu
// chưa cấu hình RESEND_API_KEY thì fallback về Gmail (GMAIL_USER/PASS) như cũ, chủ yếu
// để không phá vỡ máy dev cục bộ trong lúc chuyển đổi hạ tầng.
let cachedTransporter;
let cachedFrom;

function buildTransporter() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    cachedFrom = process.env.MAIL_FROM || 'DIA+ <no-reply@diaplus.vn>';
    logger.info(`[Mailer] Dùng Resend (key ...${RESEND_API_KEY.slice(-4)}), from: ${cachedFrom}`);
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: RESEND_API_KEY },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  const GMAIL_USER = process.env.GMAIL_USER || process.env.MAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAIL_PASS;
  if (GMAIL_USER && GMAIL_PASS) {
    cachedFrom = process.env.MAIL_FROM || `DIA+ <${GMAIL_USER}>`;
    logger.warn(`[Mailer] KHÔNG thấy RESEND_API_KEY - dùng Gmail fallback (${GMAIL_USER}).`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  logger.error('[Mailer] Không có RESEND_API_KEY lẫn GMAIL_USER/PASS - không thể gửi mail.');
  cachedFrom = null;
  return null;
}

function getTransporter() {
  if (cachedTransporter === undefined) cachedTransporter = buildTransporter();
  return cachedTransporter;
}

function getFromAddress() {
  getTransporter();
  return cachedFrom;
}

module.exports = { getTransporter, getFromAddress };
