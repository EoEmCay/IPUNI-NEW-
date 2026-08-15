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
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    sendError(res, `Lỗi hệ thống: ${err.message}`, 500);
  }
}

module.exports = { track,  overview,
  getUsers,
  charts, recent, exportSheets, health };
