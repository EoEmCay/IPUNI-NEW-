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
  try {
    const { getTransporter, getFromAddress } = require('../../utils/mailer');
    const transporter = getTransporter();
    if (!transporter) {
      return sendError(res, 'Không có transporter nào được cấu hình (thiếu RESEND_API_KEY lẫn GMAIL_USER/PASS)', 500);
    }
    const to = req.body?.to;
    if (!to) return sendError(res, 'Thiếu "to" trong body', 400);

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: 'DIA+ - Test chẩn đoán Resend',
      text: `Email chẩn đoán, gửi lúc ${new Date().toISOString()}`,
    });

    sendSuccess(res, {
      from: getFromAddress(),
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
    });
  } catch (err) {
    sendError(res, `Lỗi gửi mail: ${err.message}`, 500);
  }
}

module.exports = { track,  overview,
  getUsers,
  charts, recent, exportSheets, health, testMail };
