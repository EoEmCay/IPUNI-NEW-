// Gom thuốc theo đơn + trạng thái hết thuốc của từng đơn (Tủ thuốc, màn xác nhận quét đơn).

// Đơn hết thuốc quá số ngày này thì thu gọn thành 1 dòng (để mấy ngày đầu vẫn thấy đơn mang đi tái khám).
export const COLLAPSE_AFTER_DAYS = 7;
// Còn từ ngần này ngày trở xuống thì báo "sắp hết thuốc".
export const LOW_SUPPLY_DAYS = 3;

// Mỗi đơn thuốc 1 màu để thuốc của đơn này nhìn khác thuốc của đơn kia.
const PRESCRIPTION_COLORS = [
  { c: '#1B5FA6', soft: '#E8F0FA' }, // xanh dương
  { c: '#0F766E', soft: '#E0F2EF' }, // xanh ngọc
  { c: '#7C3AED', soft: '#F1EAFE' }, // tím
  { c: '#C2410C', soft: '#FDEDE4' }, // cam
  { c: '#BE185D', soft: '#FCE7F1' }, // hồng
  { c: '#15803D', soft: '#E4F5EA' }, // xanh lá
];

// "60 viên" / "1/2 viên" / "1,5 gói" -> số; không đọc được -> null
const firstNumber = (text) => {
  const m = /(\d+)\s*\/\s*(\d+)|(\d+(?:[.,]\d+)?)/.exec(String(text || ''));
  if (!m) return null;
  return m[1] ? Number(m[1]) / Number(m[2]) : Number(m[3].replace(',', '.'));
};

// Số ngày đủ thuốc = số lượng / (số viên mỗi lần x số lần mỗi ngày). Chỉ áp dụng thuốc đếm được
// (viên/gói/ống); bút tiêm, lọ không ước được.
export function estimateDaysFromQuantity(med) {
  if (!/(viên|gói|ống|\d\s*v\b|tablet)/i.test(med.quantity || '')) return null;
  const qty = firstNumber(med.quantity);
  const perDose = firstNumber(med.amountPerDose) || 1;
  const perDay = Number(med.timesPerDay) || (Array.isArray(med.times) ? med.times.length : 0);
  if (!qty || !perDay) return null;
  const days = Math.floor(qty / (perDose * perDay));
  return days > 0 ? days : null;
}

// Số ngày lịch từ hôm nay tới ngày kết thúc 'YYYY-MM-DD' (âm = đã qua). Theo ngày lịch trên máy người dùng.
export function daysUntil(endDateStr, today = new Date()) {
  const [y, m, d] = String(endDateStr).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(y, m - 1, d) - start) / 86400000);
}

/**
 * Gom thuốc theo đơn (bác sĩ + ngày kê). Đánh số/màu theo thời gian (đơn cũ nhất = Đơn 1) để thêm
 * đơn mới không đổi màu đơn cũ. Mỗi đơn có:
 *  - endDate / daysLeft: ngày hết thuốc = ngày kết thúc muộn nhất; null nếu còn thuốc chưa có ngày kết thúc
 *  - status: 'active' | 'finished' (đã hết, chưa quá 7 ngày) | 'collapsed' (thu gọn)
 * Thứ tự hiển thị: đơn đang uống (mới nhất trước) -> đơn vừa hết -> đơn đã thu gọn.
 */
export function groupByPrescription(medications = [], today = new Date()) {
  const byKey = {};
  medications.forEach((med) => {
    const date = med.prescribed_at || med.created_at;
    const key = `${med.doctor_name || ''}_${date ? new Date(date).toLocaleDateString('vi-VN') : ''}`;
    byKey[key] ||= { key, doctor_name: med.doctor_name, prescribed_at: date, next_appointment_date: null, medications: [] };
    if (med.next_appointment_date) byKey[key].next_appointment_date = med.next_appointment_date;
    byKey[key].medications.push(med);
  });

  const oldestFirst = Object.values(byKey).sort((a, b) => new Date(a.prescribed_at || 0) - new Date(b.prescribed_at || 0));
  oldestFirst.forEach((g, i) => {
    g.number = i + 1;
    g.color = PRESCRIPTION_COLORS[i % PRESCRIPTION_COLORS.length];
    const ends = g.medications.map((m) => m.end_date);
    g.endDate = ends.every(Boolean) ? ends.map((e) => String(e).slice(0, 10)).sort().at(-1) : null;
    g.daysLeft = g.endDate ? daysUntil(g.endDate, today) : null;
    g.status = g.daysLeft == null || g.daysLeft >= 0 ? 'active'
      : g.daysLeft < -COLLAPSE_AFTER_DAYS ? 'collapsed' : 'finished';
  });

  const rank = { active: 0, finished: 1, collapsed: 2 };
  return oldestFirst.reverse().sort((a, b) => rank[a.status] - rank[b.status]);
}
