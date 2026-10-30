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
// Mọi số liệu dưới đây đọc từ DB thật. Trước đây hàm này trả về các con số gõ cứng và biểu đồ
// dùng Math.random() - tuyệt đối không dùng số đó để báo cáo hay pitch.

const VN_OFFSET_MS = 7 * 3600000;
const toSqlUtc = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// 00:00 hôm nay theo giờ Việt Nam, đổi sang UTC (DB lưu UTC)
function vnMidnightUtc(daysBack = 0) {
  const vn = new Date(Date.now() + VN_OFFSET_MS);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - daysBack) - VN_OFFSET_MS);
}

// Giá trị cột thời gian (Date của pg hoặc chuỗi 'YYYY-MM-DD HH:MM:SS' của SQLite, đều là UTC) -> 'YYYY-MM-DD' giờ VN
function vnDayKey(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(String(value)) ? String(value) : `${String(value).replace(' ', 'T')}Z`);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

async function groupCount(table, column, builder) {
  const q = db(table).select(`${column} as name`).count('* as value').groupBy(column);
  if (builder) builder(q);
  const rows = await q;
  return rows.map((r) => ({ name: r.name == null || r.name === '' ? 'Chưa rõ' : String(r.name), value: Number(r.value) || 0 }));
}

async function getOverview() {
  const todayStart = toSqlUtc(vnMidnightUtc(0));
  const d30 = toSqlUtc(vnMidnightUtc(30));
  const monthStart = (() => {
    const vn = new Date(Date.now() + VN_OFFSET_MS);
    return toSqlUtc(new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - VN_OFFSET_MS));
  })();

  const [pageViews, pageViewsToday, visitorRow, totalUsers, realUsers, demoUsers, proUsers, newUsersToday,
    activeUsers30d, totalScans, scansThisMonth, totalMedications, totalAppointments, totalMetrics] = await Promise.all([
    countWhere('analytics_events', (q) => q.where('event_type', 'page_view')),
    countWhere('analytics_events', (q) => q.where('event_type', 'page_view').andWhere('created_at', '>=', todayStart)),
    db('analytics_events').where('event_type', 'page_view').whereNotNull('session_id').countDistinct('session_id as c').first(),
    countWhere('users'),
    countWhere('users', notDemo),
    countWhere('users', isDemo),
    countWhere('users', (q) => { notDemo(q); q.andWhere('plan', 'pro'); }),
    countWhere('users', (q) => { notDemo(q); q.andWhere('created_at', '>=', todayStart); }),
    countWhere('users', (q) => { notDemo(q); q.andWhere('last_active_at', '>=', d30); }),
    countWhere('scan_usages'),
    countWhere('scan_usages', (q) => q.where('scanned_at', '>=', monthStart)),
    countWhere('medications'),
    countWhere('appointments'),
    countWhere('metrics'),
  ]);

  return {
    pageViews,
    pageViewsToday,
    uniqueVisitors: Number(visitorRow && visitorRow.c) || 0,
    totalUsers,
    realUsers,
    demoUsers,
    proUsers,
    newUsersToday,
    activeUsers30d,
    totalScans,
    scansThisMonth,
    totalMedications,
    totalAppointments,
    totalMetrics,
    generatedAt: new Date().toISOString(),
  };
}

/* ───────────────────────── Dữ liệu biểu đồ ───────────────────────── */

// Đếm số dòng theo ngày VN trong `days` ngày gần nhất, đủ ngày (ngày không có dữ liệu = 0)
async function dailySeries(table, column, days, builder) {
  const q = db(table).where(column, '>=', toSqlUtc(vnMidnightUtc(days - 1))).select(column).limit(200000);
  if (builder) builder(q);
  const rows = await q;
  const counts = {};
  rows.forEach((r) => { const k = vnDayKey(r[column]); if (k) counts[k] = (counts[k] || 0) + 1; });
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = vnMidnightUtc(i);
    const vn = new Date(key.getTime() + VN_OFFSET_MS);
    const day = vn.toISOString().slice(0, 10);
    out.push({ day, label: `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}`, count: counts[day] || 0 });
  }
  return out;
}

async function getCharts(days = 14) {
  const [views, registrations, scans, plans, diagnoses, topPageRows, eventRows, realUsers, demoUsers] = await Promise.all([
    dailySeries('analytics_events', 'created_at', days, (q) => q.andWhere('event_type', 'page_view')),
    dailySeries('users', 'created_at', days, notDemo),
    dailySeries('scan_usages', 'scanned_at', days),
    groupCount('users', 'plan', notDemo),
    groupCount('users', 'diagnosis', notDemo),
    groupCount('analytics_events', 'path', (q) => q.where('event_type', 'page_view').orderBy('value', 'desc').limit(8)),
    groupCount('analytics_events', 'event_type'),
    countWhere('users', notDemo),
    countWhere('users', isDemo),
  ]);

  return {
    timeseries: { views, registrations, scans },
    planDistribution: plans,
    userTypeDistribution: [
      { name: 'Người dùng thật', value: realUsers },
      { name: 'Tài khoản demo', value: demoUsers },
    ],
    diagnosisDistribution: diagnoses,
    topPages: topPageRows,
    eventBreakdown: eventRows,
  };
}

// Phễu 4 sự kiện cốt lõi của vòng chăm sóc (nhắc đã gửi / liều xác nhận / báo người nhà đã gửi / đã biết)
async function getCareFunnel(days = 14) {
  return require('../../services/careEvents.service').getFunnel(days);
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

async function getUsers() {
  const users = await db('users')
    .select('id', 'name', 'email', 'created_at', 'diagnosis')
    .orderBy('created_at', 'desc');
  return users;
}

async function wipeAllData() {
  const tables = [
    'metrics',
    'medications',
    'appointments',
    'advice',
    'scan_usages',
    'analytics_events',
    'clinical_care_plans',
    'clinical_audit_logs',
    'clinical_sessions',
    'users'
  ];

  const results = {};
  for (const table of tables) {
    try {
      const deleted = await db(table).del();
      results[table] = deleted;
    } catch (err) {
      results[table] = `skipped (${err.message})`;
    }
  }
  return { success: true, wiped: results, wipedAt: new Date().toISOString() };
}

module.exports = {
  recordEvent,
  getOverview,
  getUsers,
  getCharts,
  getCareFunnel,
  getRecent,
  buildReport,
  wipeAllData,
};
