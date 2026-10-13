'use strict';
// Logic thuần (không đụng DB) cho phần "chăm sóc": kiểu lỡ cữ lặp lại, bản tin tuần cho con,
// số liệu trang tóm tắt cho bác sĩ. Mọi con số do code tính chính xác - không dùng AI để đếm,
// nên không bao giờ có số liệu bịa.

const DOW_LABEL = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const LOW = 3.9;
const VERY_HIGH = 13.9;

function partOfDay(slot) {
  const h = Number(String(slot).slice(0, 2));
  if (h < 11) return 'sáng';
  if (h < 14) return 'trưa';
  if (h < 18) return 'chiều';
  return 'tối';
}

// "cữ tối thứ Bảy (21:00)"
function slotLabel(dow, slot) {
  return `cữ ${partOfDay(slot)} ${DOW_LABEL[dow]} (${slot})`;
}

// doses: [{ medName, dateStr: 'YYYY-MM-DD', dow: 0..6, slot: 'HH:MM', taken: bool }]
function adherence(doses) {
  const expected = doses.length;
  const taken = doses.filter((d) => d.taken).length;
  return { expected, taken, percent: expected ? Math.round((taken / expected) * 100) : null };
}

function adherenceByMed(doses) {
  const byMed = new Map();
  for (const d of doses) {
    if (!byMed.has(d.medName)) byMed.set(d.medName, []);
    byMed.get(d.medName).push(d);
  }
  return [...byMed].map(([name, list]) => ({ name, ...adherence(list) }));
}

/**
 * Kiểu lỡ cữ lặp lại: cùng thứ trong tuần + cùng giờ cữ, bị lỡ >= minMissed lần và >= minRatio
 * số tuần có cữ đó (vd tối thứ Bảy lỡ 3/4 tuần). Một ngày tính là lỡ nếu có thuốc nào trong cữ đó
 * chưa uống.
 */
function findMissPatterns(doses, { minMissed = 3, minRatio = 0.6 } = {}) {
  const groups = new Map();
  for (const d of doses) {
    const key = `${d.dow}|${d.slot}`;
    if (!groups.has(key)) groups.set(key, { dow: d.dow, slot: d.slot, days: new Map(), meds: new Set() });
    const g = groups.get(key);
    const prev = g.days.get(d.dateStr);
    g.days.set(d.dateStr, prev === undefined ? d.taken : prev && d.taken);
    if (!d.taken) g.meds.add(d.medName);
  }
  const out = [];
  for (const g of groups.values()) {
    const total = g.days.size;
    const missed = [...g.days.values()].filter((ok) => !ok).length;
    if (missed >= minMissed && missed / total >= minRatio) {
      out.push({ dow: g.dow, slot: g.slot, missed, total, meds: [...g.meds], label: slotLabel(g.dow, g.slot) });
    }
  }
  return out.sort((a, b) => b.missed / b.total - a.missed / a.total || b.missed - a.missed);
}

// readings: [{ value (mmol/L), measured_at }]
function glucoseStats(readings) {
  const vals = readings.map((r) => Number(r.value)).filter(Number.isFinite);
  const count = vals.length;
  const avg = count ? vals.reduce((a, b) => a + b, 0) / count : null;
  const inRange = count ? vals.filter((v) => v >= LOW && v <= 10).length : 0;
  return {
    count,
    average: avg == null ? null : +avg.toFixed(1),
    timeInRangePercent: count ? Math.round((inRange / count) * 100) : null,
    lows: readings.filter((r) => Number(r.value) < LOW),
    highs: readings.filter((r) => Number(r.value) > VERY_HIGH),
  };
}

// "07/10" từ 'YYYY-MM-DD' hoặc ISO (đổi ISO sang ngày VN bằng toVnDateStr)
function dayMonth(dateStrOrIso, toVnDateStr = (x) => x) {
  const s = /^\d{4}-\d{2}-\d{2}$/.test(dateStrOrIso) ? dateStrOrIso : toVnDateStr(new Date(dateStrOrIso));
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

/**
 * Bản tin tuần cho con cháu: vài dòng dễ đọc. Chỉ ghép câu từ số liệu đã tính - không suy diễn
 * y khoa, không khuyên đổi thuốc/liều.
 */
function buildWeeklyText({ name, week, prevWeek, missedDoses, patterns, glucose, toVnDateStr }) {
  const who = name || 'Người thân';
  const lines = [];

  if (week.expected) {
    let trend = '';
    if (prevWeek && prevWeek.percent != null) {
      if (week.percent > prevWeek.percent) trend = ` - tốt hơn tuần trước (${prevWeek.percent}%)`;
      else if (week.percent < prevWeek.percent) trend = ` - kém hơn tuần trước (${prevWeek.percent}%)`;
      else trend = ' - bằng tuần trước';
    }
    lines.push(`Uống thuốc: ${week.taken}/${week.expected} cữ (${week.percent}%)${trend}.`);
    if (missedDoses.length) {
      const shown = missedDoses.slice(0, 4)
        .map((d) => `${d.medName} ${partOfDay(d.slot)} ${dayMonth(d.dateStr)}`).join(', ');
      const more = missedDoses.length > 4 ? ` và ${missedDoses.length - 4} cữ khác` : '';
      lines.push(`Các cữ bị lỡ: ${shown}${more}.`);
    } else {
      lines.push('Không lỡ cữ nào trong tuần.');
    }
  }

  for (const p of patterns.slice(0, 2)) {
    lines.push(`Lưu ý: Hay quên ${p.label} (lỡ ${p.missed}/${p.total} tuần gần đây). Gia đình có thể gọi nhắc vào lúc này.`);
  }

  if (glucose.count) {
    lines.push(`Đường huyết: ${glucose.count} lần đo, trung bình ${glucose.average} mmol/L.`);
    if (glucose.lows.length) {
      const l = glucose.lows[0];
      lines.push(`Cảnh báo: ${glucose.lows.length} lần đường huyết thấp (ví dụ ${l.value} mmol/L ngày ${dayMonth(l.measured_at, toVnDateStr)}).`);
    }
    if (glucose.highs.length) {
      lines.push(`Cảnh báo: ${glucose.highs.length} lần đường huyết rất cao (> ${VERY_HIGH} mmol/L).`);
    }
  } else if (week.expected) {
    lines.push('Đường huyết: Tuần này chưa ghi nhận số đo nào.');
  }

  if (!lines.length) lines.push('Tuần này chưa có dữ liệu ghi nhận.');
  return { title: `Bản tin tuần của ${who}`, lines };
}

module.exports = {
  DOW_LABEL, partOfDay, slotLabel, adherence, adherenceByMed, findMissPatterns, glucoseStats, buildWeeklyText,
};
