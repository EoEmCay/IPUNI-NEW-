/* Chạy: node src/utils/prescription.test.js */
import assert from 'node:assert';
import { estimateDaysFromQuantity, daysUntil, groupByPrescription } from './prescription.js';

// Ước số ngày từ số lượng
assert.strictEqual(estimateDaysFromQuantity({ quantity: '60 viên', amountPerDose: '1 viên', timesPerDay: 2 }), 30);
assert.strictEqual(estimateDaysFromQuantity({ quantity: '30v', amountPerDose: '1/2 viên', timesPerDay: 2 }), 30);
assert.strictEqual(estimateDaysFromQuantity({ quantity: '28 viên', times: ['07:00'] }), 28);
assert.strictEqual(estimateDaysFromQuantity({ quantity: '1 bút tiêm', amountPerDose: '12 đơn vị', timesPerDay: 1 }), null);
assert.strictEqual(estimateDaysFromQuantity({ quantity: '60 viên' }), null); // không biết uống mấy lần/ngày
assert.strictEqual(estimateDaysFromQuantity({}), null);

// Ngày còn lại
const today = new Date(2026, 9, 7); // 07/10/2026
assert.strictEqual(daysUntil('2026-10-07', today), 0);
assert.strictEqual(daysUntil('2026-10-10', today), 3);
assert.strictEqual(daysUntil('2026-09-30', today), -7);

// Trạng thái đơn: đang uống / vừa hết (<=7 ngày) / thu gọn (>7 ngày)
const med = (id, doctor, date, end) => ({ id, doctor_name: doctor, prescribed_at: date, end_date: end });
const groups = groupByPrescription([
  med(1, 'BS A', '2026-05-08', '2026-09-29'), // hết 8 ngày trước -> thu gọn
  med(2, 'BS A', '2026-05-08', '2026-09-20'),
  med(3, 'BS B', '2026-09-01', '2026-10-01'), // hết 6 ngày trước -> vừa hết
  med(4, 'BS C', '2026-10-01', '2026-10-09'), // còn 2 ngày
  med(5, 'BS D', '2026-10-05', null), // không có ngày kết thúc -> luôn đang uống
  med(6, 'BS D', '2026-10-05', '2026-10-05'),
], today);
const byDoctor = Object.fromEntries(groups.map((g) => [g.doctor_name, g]));
assert.strictEqual(byDoctor['BS A'].status, 'collapsed');
assert.strictEqual(byDoctor['BS A'].endDate, '2026-09-29'); // ngày kết thúc muộn nhất của đơn
assert.strictEqual(byDoctor['BS A'].number, 1); // số đơn giữ theo thời gian, không đổi khi thu gọn
assert.strictEqual(byDoctor['BS B'].status, 'finished');
assert.strictEqual(byDoctor['BS C'].status, 'active');
assert.strictEqual(byDoctor['BS C'].daysLeft, 2);
assert.strictEqual(byDoctor['BS D'].status, 'active');
assert.strictEqual(byDoctor['BS D'].endDate, null);
assert.deepStrictEqual(groups.map((g) => g.doctor_name), ['BS D', 'BS C', 'BS B', 'BS A']); // đang uống trước, thu gọn cuối

console.log('prescription: OK');
