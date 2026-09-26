'use strict';

/** Ngưỡng cờ đỏ lâm sàng (mmol/L) — theo yêu cầu Bác sĩ Nội tiết. */
const CLINIC_THRESHOLDS = Object.freeze({
  HYPO: 3.9, // hạ đường huyết
  SEVERE_HYPER: 13.9, // ~250 mg/dL — nguy cơ nhiễm toan ceton / tăng ALTT
  POOR_ADHERENCE: 0.75, // < 75% tuân thủ
  INACTIVE_DAYS: 14, // không đo > 14 ngày
});

module.exports = { CLINIC_THRESHOLDS };
