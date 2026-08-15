const service = require('./analytics.service');
const { pushReport } = require('./googleSheets');
const { sendSuccess, sendError } = require('../../utils/response.helper');

// POST /analytics/track  (công khai — app chính gọi để ghi lượt truy cập)
async function track(req, res, next) {
  try {
    const { event_type, path, session_id, user_id, referrer, meta } = req.body || {};
    await service.recordEvent({
      event_type,
      path,
      session_id,
      user_id,
      referrer,
      user_agent: req.headers['user-agent'],
      meta,
    });
    sendSuccess(res, null, 'Đã ghi nhận');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// GET /analytics/overview  (admin)
async function overview(req, res, next) {
  try {
    sendSuccess(res, await service.getOverview());
  } catch (err) {
    next(err);
  }
}

// GET /analytics/users (admin)
async function getUsers(req, res, next) {
  try {
    sendSuccess(res, await service.getUsers());
  } catch (err) {
    next(err);
  }
}

// GET /analytics/charts?days=14  (admin)
async function charts(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
    sendSuccess(res, await service.getCharts(days));
  } catch (err) {
    next(err);
  }
}

// GET /analytics/recent  (admin)
async function recent(req, res, next) {
  try {
    sendSuccess(res, await service.getRecent());
  } catch (err) {
    next(err);
  }
}

// POST /analytics/export-sheets  (admin) — đẩy báo cáo sang Google Sheets
async function exportSheets(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
    const report = await service.buildReport(days);
    const result = await pushReport(report);
    sendSuccess(res, result, 'Đã xuất báo cáo sang Google Sheets');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// GET /analytics/health  (admin) — kiểm tra hệ thống
async function health(req, res, next) {
  try {
    const db = require('../../config/database');
    const { getFromAddress } = require('../../utils/mailer');
    const start = Date.now();
    await db.raw('select 1');
    const dbLatency = Date.now() - start;
    sendSuccess(res, {
      status: 'ok',
      dbConnected: true,
      dbLatencyMs: dbLatency,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      sheetsConfigured: !!process.env.GOOGLE_SHEETS_WEBHOOK_URL,
      mailProvider: process.env.RESEND_API_KEY ? 'resend' : ((process.env.GMAIL_USER || process.env.MAIL_USER) ? 'gmail' : 'none'),
      mailFrom: getFromAddress(),
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    sendError(res, `Lỗi hệ thống: ${err.message}`, 500);
  }
}

// POST /analytics/test-mail  (admin) — công cụ chẩn đoán tạm thời: gửi 1 email thật và
// trả về NGUYÊN VĂN phản hồi SMTP (messageId, response, accepted/rejected) thay vì chỉ
// "thành công/thất bại" chung chung như luồng OTP bình thường. Xoá sau khi dùng xong.
async function testMail(req, res) {
  const to = req.body?.to;
  if (!to) return sendError(res, 'Thiếu "to" trong body', 400);
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return sendError(res, 'Thiếu RESEND_API_KEY', 500);

  const nodemailer = require('nodemailer');
  const dns = require('dns').promises;
  const net = require('net');

  const results = { to };

  // 1. DNS resolve smtp.resend.com từ chính mạng Render
  try {
    results.dns = await dns.resolve4('smtp.resend.com');
  } catch (err) {
    results.dns = `LỖI DNS: ${err.message}`;
  }

  // 2. Thử kết nối TCP thô tới từng cổng, không qua nodemailer, để biết chính xác cổng nào mở
  const tryPort = (port) => new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();
    socket.setTimeout(6000);
    socket.once('connect', () => { socket.destroy(); resolve({ port, ok: true, ms: Date.now() - start }); });
    socket.once('timeout', () => { socket.destroy(); resolve({ port, ok: false, error: 'timeout', ms: Date.now() - start }); });
    socket.once('error', (err) => { resolve({ port, ok: false, error: err.message, ms: Date.now() - start }); });
    socket.connect(port, 'smtp.resend.com');
  });
  results.tcp465 = await tryPort(465);
  results.tcp587 = await tryPort(587);

  // 3. Nếu TCP mở được ở cổng nào, thử gửi thật qua nodemailer ở đúng cổng đó
  for (const [key, port, secure] of [['sendVia465', 465, true], ['sendVia587', 587, false]]) {
    if (!results[`tcp${port}`].ok) {
      results[key] = 'bỏ qua vì TCP không kết nối được';
      continue;
    }
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com', port, secure,
        auth: { user: 'resend', pass: RESEND_API_KEY },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
      });
      const info = await transporter.sendMail({
        from: 'DIA+ <no-reply@diaplus.vn>', to,
        subject: `DIA+ - Test cổng ${port}`,
        text: `Test gửi qua cổng ${port}, lúc ${new Date().toISOString()}`,
      });
      results[key] = { ok: true, messageId: info.messageId, response: info.response };
    } catch (err) {
      results[key] = { ok: false, error: err.message };
    }
  }

  sendSuccess(res, results);
}

module.exports = { track,  overview,
  getUsers,
  charts, recent, exportSheets, health, testMail };
