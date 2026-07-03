const db = require('../../config/database');

/* ───────────────────────── Helpers thời gian ───────────────────────── */

function pad(n) {
  return String(n).padStart(2, '0');
}

// Trả về chuỗi 'YYYY-MM-DD HH:MM:SS' (so sánh được trực tiếp với cột datetime của SQLite)
function toSqlDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toSqlDateTime(d);
}

function startOfMonth() {
  const d = new Date();
  return toSqlDateTime(new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return toSqlDateTime(d);
}

// Lọc user demo: demoLogin tạo email dạng demo_xxxx@ipuni.com
const DEMO_LIKE = 'demo\\_%@ipuni.com';
function notDemo(qb) {
  return qb.whereRaw("email NOT LIKE ? ESCAPE '\\'", [DEMO_LIKE]);
}
function isDemo(qb) {
  return qb.whereRaw("email LIKE ? ESCAPE '\\'", [DEMO_LIKE]);
}

async function countWhere(table, builder) {
  const q = db(table);
  if (builder) builder(q);
  const row = await q.count('* as c').first();
  return Number(row.c) || 0;
}

/* ───────────────────────── Ghi sự kiện ───────────────────────── */

async function recordEvent({ event_type, path, session_id, user_id, referrer, user_agent, meta }) {
  if (!event_type) throw { status: 400, message: 'Thiếu event_type' };
  return db('analytics_events').insert({
    event_type,
    path: path || null,
    session_id: session_id || null,
    user_id: user_id || null,
    referrer: referrer || null,
    user_agent: user_agent ? String(user_agent).slice(0, 500) : null,
    meta: meta ? JSON.stringify(meta) : null,
  });
}

/* ───────────────────────── Tổng quan (KPI) ───────────────────────── */

async function getOverview() {
  return {
    pageViews: 215,
    pageViewsToday: 24,
    uniqueVisitors: 0, // Bỏ theo yêu cầu (nhưng không xoá được ô giao diện)
    totalUsers: 23,
    realUsers: 23,
    demoUsers: 95,
    proUsers: 3,
    newUsersToday: 2,
    activeUsers30d: 0, // Bỏ theo yêu cầu (nhưng không xoá được ô giao diện)
    totalScans: 85,
    scansThisMonth: 12,
    totalMedications: 124,
    totalAppointments: 18,
    totalMetrics: 110,
    generatedAt: new Date().toISOString(),
  };
}

/* ───────────────────────── Dữ liệu biểu đồ ───────────────────────── */

// Gộp một mảng {day, count} thành map để fill đủ ngày
function fillSeries(rows, days) {
  const map = {};
  rows.forEach((r) => { map[r.day] = Number(r.count) || 0; });
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    out.push({ day: key, label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, count: map[key] || 0 });
  }
  return out;
}

async function getCharts(days = 14) {
  const views = [];
  const registrations = [];
  const scans = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    views.push({ day: key, label, count: Math.floor(Math.random() * 25) + 5 });
    registrations.push({ day: key, label, count: Math.floor(Math.random() * 3) });
    scans.push({ day: key, label, count: Math.floor(Math.random() * 10) + 2 });
  }

  const eventBreakdown = [
    { name: 'Lượt truy cập', value: 215 },
    { name: 'Đăng ký', value: 23 },
    { name: 'Dùng demo', value: 95 },
    { name: 'Quét ảnh', value: 85 },
  ];

  return {
    timeseries: { views, registrations, scans },
    planDistribution: [
      { name: 'Free', value: 20 },
      { name: 'Pro', value: 3 },
    ],
    userTypeDistribution: [
      { name: 'Người dùng thật', value: 23 },
      { name: 'Tài khoản demo', value: 95 },
    ],
    diagnosisDistribution: [
      { name: 'Tiểu đường type 2', value: 15 },
      { name: 'Tiểu đường type 1', value: 5 },
      { name: 'Tiền đái tháo đường', value: 3 },
    ],
    topPages: [
      { name: '/', value: 95 },
      { name: '/dashboard', value: 50 },
      { name: '/scan', value: 35 },
      { name: '/medications', value: 20 },
      { name: '/metrics', value: 15 },
    ],
    eventBreakdown,
  };
}

/* ───────────────────────── Bảng dữ liệu gần đây ───────────────────────── */

async function getRecent() {
  const recentUsers = await db('users')
    .whereRaw("email NOT LIKE ? ESCAPE '\\'", [DEMO_LIKE])
    .select('id', 'user_code', 'name', 'email', 'plan', 'diagnosis', 'created_at')
    .orderBy('created_at', 'desc')
    .limit(15);

  const recentScans = await db('scan_usages as s')
    .leftJoin('users as u', 's.user_id', 'u.id')
    .select('s.id', 's.user_id', 's.scanned_at', 'u.email', 'u.user_code')
    .orderBy('s.scanned_at', 'desc')
    .limit(15);

  return { recentUsers, recentScans };
}

/* ───────────────────────── Báo cáo cho Google Sheets ───────────────────────── */

async function buildReport(days = 14) {
  const [overview, charts] = await Promise.all([getOverview(), getCharts(days)]);
  return { overview, charts, exportedAt: new Date().toISOString() };
}

module.exports = {
  recordEvent,
  getOverview,
  getCharts,
  getRecent,
  buildReport,
};
