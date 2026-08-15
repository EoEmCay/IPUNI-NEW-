const nodemailer = require('nodemailer');
const logger = require('./logger');

// Nơi duy nhất khởi tạo transporter gửi mail cho toàn bộ app - trước đây otp.service.js
// và auth.service.js mỗi nơi tự dựng transporter Gmail riêng (3 chỗ trùng lặp).
//
// Ưu tiên Resend (dịch vụ email giao dịch, domain riêng diaplus.vn, không phụ thuộc 1
// Gmail cá nhân dễ bị Google tự động chặn/giới hạn khi gửi tự động số lượng lớn). Nếu
// chưa cấu hình RESEND_API_KEY thì fallback về Gmail (GMAIL_USER/PASS) như cũ, chủ yếu
// để không phá vỡ máy dev cục bộ trong lúc chuyển đổi hạ tầng.
//
// QUAN TRỌNG: Resend được gọi qua HTTP API (api.resend.com), KHÔNG qua SMTP. Đã xác
// nhận bằng chẩn đoán trực tiếp trên production rằng Render chặn hoàn toàn outbound SMTP
// (cả cổng 465 lẫn 587 đều timeout ở mức TCP thô, dù DNS phân giải bình thường) - đây là
// giới hạn phổ biến của các PaaS free-tier để chống spam, không phải lỗi cấu hình. HTTP
// API tránh hoàn toàn vấn đề này vì chỉ là 1 request HTTPS thông thường (cổng 443).
let cachedTransporter;
let cachedFrom;

function buildResendTransporter(apiKey) {
  cachedFrom = process.env.MAIL_FROM || 'DIA+ <no-reply@diaplus.vn>';
  logger.info(`[Mailer] Dùng Resend qua HTTP API (key ...${apiKey.slice(-4)}), from: ${cachedFrom}`);
  return {
    async sendMail({ from, to, subject, text, html }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: from || cachedFrom, to, subject, text, html }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Resend API lỗi (${res.status}): ${body?.message || JSON.stringify(body)}`);
      }
      return { messageId: body.id, response: 'resend-api-ok', accepted: [to], rejected: [] };
    },
  };
}

function buildTransporter() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    return buildResendTransporter(RESEND_API_KEY);
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
