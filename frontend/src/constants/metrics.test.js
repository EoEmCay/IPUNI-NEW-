/* Chạy: node src/constants/metrics.test.js  (không cần framework) */
import assert from 'node:assert';
import { getMetricStatus, getPersonalTarget } from './metrics.js';

const cases = [
  // [loại, giá trị, chẩn đoán, trạng thái mong đợi, mô tả]
  ['glucose_fasting', 6.1, 'type2_diabetes', 'normal', 'type 2, đói 6.1 -> đạt mục tiêu (trước đây: Tiền ĐTĐ)'],
  ['glucose_fasting', 7.4, 'type2_diabetes', 'above_target', 'type 2, đói 7.4 -> hơi cao (trước đây: Đái tháo đường)'],
  ['glucose_fasting', 10.6, 'type2_diabetes', 'danger', 'type 2, đói >10.5 -> cao'],
  ['glucose_fasting', 3.5, 'type2_diabetes', 'low', 'hạ đường huyết luôn được báo'],
  ['glucose_fasting', 7.4, null, 'above_target', 'chưa khai chẩn đoán -> coi như type 2'],
  ['glucose_fasting', 6.1, 'prediabetes', 'prediabetes', 'tiền ĐTĐ -> vẫn dùng ngưỡng sàng lọc'],
  ['glucose_postmeal', 9.5, 'type2_diabetes', 'normal', 'sau ăn 9.5 -> đạt mục tiêu (<10)'],
  ['hba1c', 7.2, 'type2_diabetes', 'above_target', 'HbA1c 7.2 -> hơi cao'],
  ['hba1c', 8.6, 'type2_diabetes', 'danger', 'HbA1c >8.5 -> cao'],
  ['blood_pressure', 135, 'type2_diabetes', 'danger', 'huyết áp không đổi logic'],
];
for (const [type, v, dx, want, name] of cases) {
  assert.strictEqual(getMetricStatus(type, v, dx), want, name);
  console.log('  ✓', name);
}
assert.strictEqual(getPersonalTarget('glucose_fasting', 'type2_diabetes'), 7.0);
assert.strictEqual(getPersonalTarget('blood_pressure', 'type2_diabetes'), null);
console.log('  ✓ getPersonalTarget');
