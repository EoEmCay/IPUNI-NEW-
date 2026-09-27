// Đơn vị hiển thị đường huyết. Dữ liệu luôn LƯU bằng mmol/L; mg/dL chỉ để hiển thị/nhập
// (nhiều máy đo và phòng khám ở VN dùng mg/dL).
export const MMOL_TO_MGDL = 18.0182; // cùng hệ số với backend metrics.calculator.js
const UNIT_KEY = 'diaplus-glucose-unit';

export function getGlucoseUnit() {
  try { return localStorage.getItem(UNIT_KEY) === 'mg/dL' ? 'mg/dL' : 'mmol/L'; } catch { return 'mmol/L'; }
}

export function setGlucoseUnit(unit) {
  try { localStorage.setItem(UNIT_KEY, unit); } catch { /* bộ nhớ trình duyệt bị chặn */ }
}

// mmol/L -> số hiển thị theo đơn vị đã chọn (mg/dL làm tròn số nguyên, mmol/L 1 chữ số thập phân)
export function formatGlucose(mmol, unit) {
  const v = mmol == null || mmol === '' ? NaN : Number(mmol);
  if (!Number.isFinite(v)) return '--';
  return unit === 'mg/dL' ? String(Math.round(v * MMOL_TO_MGDL)) : String(Math.round(v * 10) / 10);
}

// Số người dùng gõ (theo đơn vị đã chọn) -> mmol/L để lưu
export function toMmol(value, unit) {
  const v = Number(value);
  return unit === 'mg/dL' ? Math.round((v / MMOL_TO_MGDL) * 100) / 100 : v;
}
