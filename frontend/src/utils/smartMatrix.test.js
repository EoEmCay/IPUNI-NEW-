/* Chạy: node src/utils/smartMatrix.test.js */
import assert from 'node:assert';
import { inferPeriodsForMed, inferDaysForMed, DAYS, PERIODS } from './smartMatrix.js';

// 1. Kiểm tra suy luận 4 buổi trong ngày (Sáng, Trưa, Chiều, Tối)
const medMorningEvening = { name: 'Metformin 500mg', instructions: 'Uống 1 viên sau ăn sáng, 1 viên sau ăn tối' };
assert.deepStrictEqual(inferPeriodsForMed(medMorningEvening), ['morning', 'evening']);

const medNoon = { name: 'Thuốc bổ gan', instructions: 'Uống 1 viên sau ăn trưa' };
assert.deepStrictEqual(inferPeriodsForMed(medNoon), ['noon']);

const medThreeTimes = { name: 'Thuốc X', frequency: '3 lần/ngày' };
assert.deepStrictEqual(inferPeriodsForMed(medThreeTimes), ['morning', 'noon', 'evening']);

const medFourTimes = { name: 'Kháng sinh', frequency: '4 lần/ngày' };
assert.deepStrictEqual(inferPeriodsForMed(medFourTimes), ['morning', 'noon', 'afternoon', 'evening']);

// 2. Kiểm tra suy luận ngày uống
const medAlternate = { name: 'Thuốc tim mạch', frequency: 'Uống cách ngày' };
assert.deepStrictEqual(inferDaysForMed(medAlternate), ['mon', 'wed', 'fri', 'sun']);

const medFixedMonWedFri = { name: 'Thuốc Y', instructions: 'Uống thứ 2, 4, 6' };
assert.deepStrictEqual(inferDaysForMed(medFixedMonWedFri), ['mon', 'wed', 'fri']);

const medDaily = { name: 'Gliclazide 30mg', instructions: 'Uống hàng ngày' };
assert.strictEqual(inferDaysForMed(medDaily).length, 7);

// 3. Kiểm tra ma trận có đúng 7 ngày và 4 buổi = 28 ngăn
assert.strictEqual(DAYS.length, 7);
assert.strictEqual(PERIODS.length, 4);

console.log('  ✓ smartMatrix: tự động phân bổ chính xác 28 ngăn kéo CalenDIA+ theo đơn bác sĩ');
