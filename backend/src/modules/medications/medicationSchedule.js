'use strict';

/**
 * Engine lịch uống thuốc — chuẩn xác qua giao thừa, đổi tháng, năm nhuận, lệch múi giờ.
 *
 * Nguyên tắc chống lỗi biên:
 *  - Việt Nam dùng offset CỐ ĐỊNH UTC+7, không có DST (từ 1975) => dùng offset cứng an toàn tuyệt đối.
 *  - Mọi phép tính ngày chạy trên Date.UTC(y, m, d) (epoch ms nguyên) => tự đúng qua mọi biên lịch.
 *  - KHÔNG bao giờ dùng setDate()/getDate() theo giờ local của máy chủ.
 */

const VN_OFFSET_MIN = 420; // UTC+7

/** Các cữ mặc định (giờ VN). Có thể override theo hồ sơ bệnh nhân sau này. */
const SLOT_TIMES = Object.freeze({
  morning: '08:00',   // Sáng
  noon: '12:00',      // Trưa
  afternoon: '15:00', // Chiều
  evening: '19:00',   // Tối
  bedtime: '22:00',   // Trước khi ngủ
});

/* ───────────────── Tiện ích thời gian (thuần epoch) ───────────────── */

/** Phân rã một Instant (Date) thành các thành phần lịch theo giờ VN. */
function vnParts(instant) {
  const shifted = new Date(instant.getTime() + VN_OFFSET_MIN * 60000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(), // 0..11
    d: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
    dow: shifted.getUTCDay(), // 0=CN .. 6=T7
  };
}

/** 'YYYY-MM-DD' (giờ VN) của một Instant. */
function vnDateStr(instant) {
  const p = vnParts(instant);
  return `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** Parse 'YYYY-MM-DD' -> {y, m, d}. Trả null nếu sai định dạng hoặc ngày không tồn tại. */
function parseYmd(s) {
  const mo = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '').trim());
  if (!mo) return null;
  const y = +mo[1], m = +mo[2] - 1, d = +mo[3];
  const probe = new Date(Date.UTC(y, m, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m || probe.getUTCDate() !== d) return null;
  return { y, m, d };
}

/** Instant UTC ứng với "ngày VN + giờ HH:MM VN". Xử lý đúng mọi biên lịch. */
function vnWallToInstant(y, m, d, hh, mm) {
  return new Date(Date.UTC(y, m, d, hh, mm, 0) - VN_OFFSET_MIN * 60000);
}

/** Số ngày lịch giữa 2 ngày VN (b - a). Chính xác qua tháng/năm/năm nhuận. */
function dayDiff(a, b) {
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86400000);
}

/* ───────────────── Chuẩn hoá cấu hình lịch ───────────────── */

function safeJsonArray(v, fallback = []) {
  if (Array.isArray(v)) return v;
  try {
    const p = JSON.parse(v || '[]');
    return Array.isArray(p) ? p : fallback;
  } catch {
    return fallback;
  }
}

/** Suy luận lịch từ dữ liệu cũ (chỉ có `frequency` text + `times`) — GIỮ TƯƠNG THÍCH NGƯỢC. */
function inferScheduleFromLegacy(frequency = '', times = []) {
  const f = String(frequency).toLowerCase();
  if (/cách\s*ngày|cách\s*1\s*ngày|mỗi\s*2\s*ngày|2\s*ngày\s*\/\s*lần|every\s*other\s*day/.test(f)) {
    return { schedule_type: 'every_n_days', every_n_days: 2 };
  }
  const nEvery = /mỗi\s*(\d+)\s*ngày|every\s*(\d+)\s*days?/.exec(f);
  if (nEvery) return { schedule_type: 'every_n_days', every_n_days: +(nEvery[1] || nEvery[2]) };
  if (/hàng\s*tuần|1\s*lần\s*\/\s*tuần|weekly|once\s*weekly/.test(f)) {
    return { schedule_type: 'every_n_days', every_n_days: 7 };
  }
  if (/khi\s*cần|as\s*needed|\bprn\b/.test(f)) return { schedule_type: 'as_needed' };
  return { schedule_type: 'daily' };
}

/** Trả về danh sách giờ "HH:MM" (giờ VN) trong ngày cho 1 thuốc. */
function resolveTimes(med) {
  const explicit = safeJsonArray(med.times)
    .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => t.padStart(5, '0'));
  if (explicit.length) return [...new Set(explicit)].sort();

  const fromSlots = safeJsonArray(med.slots)
    .map((s) => SLOT_TIMES[s])
    .filter(Boolean);
  if (fromSlots.length) return [...new Set(fromSlots)].sort();

  return ['08:00'];
}

/**
 * Chuẩn hoá 1 bản ghi thuốc thành object lịch dùng được.
 * @returns {{scheduleType:string, everyN:number|null, daysOfWeek:number[], anchor:{y,m,d}|null, endDate:{y,m,d}|null, times:string[]}}
 */
function normalizeSchedule(med) {
  let scheduleType = med.schedule_type;
  let everyN = med.every_n_days;

  if (!scheduleType) {
    const inferred = inferScheduleFromLegacy(med.frequency, med.times);
    scheduleType = inferred.schedule_type;
    everyN = inferred.every_n_days;
  }

  return {
    scheduleType: scheduleType || 'daily',
    everyN: everyN && everyN > 0 ? Math.trunc(everyN) : (scheduleType === 'every_n_days' ? 2 : null),
    daysOfWeek: safeJsonArray(med.days_of_week).map(Number).filter((n) => n >= 0 && n <= 6),
    anchor: parseYmd(med.anchor_date) || parseYmd(med.prescribed_at) || null,
    endDate: parseYmd(med.end_date) || null,
    times: resolveTimes(med),
  };
}

/* ───────────────── Câu hỏi cốt lõi: hôm đó có phải ngày uống thuốc không? ───────────────── */

/** @param dateVn {y,m,d} ngày VN cần kiểm tra */
function isDoseDay(med, dateVn) {
  const s = normalizeSchedule(med);

  if (s.endDate && dayDiff(s.endDate, dateVn) > 0) return false;
  if (s.anchor && dayDiff(s.anchor, dateVn) < 0) return false;

  switch (s.scheduleType) {
    case 'as_needed':
      return false;
    case 'daily':
      return true;
    case 'days_of_week': {
      const dow = new Date(Date.UTC(dateVn.y, dateVn.m, dateVn.d)).getUTCDay();
      return s.daysOfWeek.includes(dow);
    }
    case 'every_n_days': {
      if (!s.anchor || !s.everyN) return false;
      const diff = dayDiff(s.anchor, dateVn);
      return diff >= 0 && diff % s.everyN === 0;
    }
    default:
      return true;
  }
}

/**
 * Tất cả liều (Instant UTC) của 1 thuốc trong khoảng [fromInstant, toInstant].
 * Dùng cho: nhắc thuốc, kiểm tra quên liều, tính "số liều kỳ vọng" của tuân thủ.
 */
function enumerateDoses(med, fromInstant, toInstant) {
  const out = [];
  const from = vnParts(fromInstant);
  const to = vnParts(toInstant);
  const totalDays = dayDiff(from, to);
  if (totalDays < 0 || totalDays > 400) return out;

  const s = normalizeSchedule(med);

  for (let i = 0; i <= totalDays; i++) {
    const base = new Date(Date.UTC(from.y, from.m, from.d) + i * 86400000);
    const dv = { y: base.getUTCFullYear(), m: base.getUTCMonth(), d: base.getUTCDate() };
    if (!isDoseDay(med, dv)) continue;

    for (const hm of s.times) {
      const [hh, mm] = hm.split(':').map(Number);
      const inst = vnWallToInstant(dv.y, dv.m, dv.d, hh, mm);
      if (inst >= fromInstant && inst <= toInstant) {
        out.push({ instant: inst, slot: hm, medicationId: med.id });
      }
    }
  }
  return out.sort((a, b) => a.instant - b.instant);
}

/** Số liều kỳ vọng của 1 thuốc trong 1 ngày VN. */
function expectedDosesOnDay(med, dateVn) {
  if (!isDoseDay(med, dateVn)) return 0;
  return normalizeSchedule(med).times.length;
}

module.exports = {
  SLOT_TIMES,
  VN_OFFSET_MIN,
  vnParts,
  vnDateStr,
  parseYmd,
  vnWallToInstant,
  dayDiff,
  normalizeSchedule,
  resolveTimes,
  inferScheduleFromLegacy,
  isDoseDay,
  enumerateDoses,
  expectedDosesOnDay,
};
