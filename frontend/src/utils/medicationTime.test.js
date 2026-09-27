/* Chạy: node src/utils/medicationTime.test.js */
import assert from 'node:assert';
import { checkMedicationTimeEligibility, hasCountableDoseOn, parseServerTime } from './medicationTime.js';

const at = (h, m = 0) => new Date(2026, 8, 27, h, m); // 27/09/2026 giờ máy
const med = (created) => ({ name: 'Metformin', frequency: '2 lần/ngày', times: '["07:00","19:00"]', created_at: created });

// Thêm lúc 10:00, cữ 07:00 đã qua -> KHÔNG trễ, nút khoá tới 19:00
let r = checkMedicationTimeEligibility(med(at(10)), at(10, 5));
assert.strictEqual(r.isLate, false, 'thuốc vừa thêm không được "quá giờ"');
assert.strictEqual(r.isTimeArrived, false);
assert.strictEqual(r.earliestUpcomingTime, '19:00');

// Thuốc đã có từ hôm qua -> cữ 07:00 lúc 10:00 là trễ thật
r = checkMedicationTimeEligibility(med(new Date(2026, 8, 26, 8)), at(10, 5));
assert.strictEqual(r.isLate, true);

// Thêm lúc 20:00 (sau mọi cữ) -> bắt đầu từ mai
r = checkMedicationTimeEligibility(med(at(20)), at(20, 5));
assert.strictEqual(r.isTimeArrived, false);
assert.strictEqual(r.startsTomorrowAt, '07:00');
assert.strictEqual(hasCountableDoseOn(med(at(20)), at(21)), false, 'không tính vào "đã dùng X/Y" hôm nay');
assert.strictEqual(hasCountableDoseOn(med(at(10)), at(21)), true);

// Tới 19:00 thì mở nút
r = checkMedicationTimeEligibility(med(at(10)), at(19, 1));
assert.strictEqual(r.isTimeArrived, true);
assert.strictEqual(r.activeSlotTime, '19:00');

// created_at kiểu SQLite (UTC, không múi giờ) được hiểu là UTC
assert.strictEqual(parseServerTime('2026-09-27 03:00:00').toISOString(), '2026-09-27T03:00:00.000Z');
console.log('  ✓ medicationTime: thuốc vừa thêm không bị tính quá giờ');
