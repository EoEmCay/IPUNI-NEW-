/* Chạy: node src/utils/smartMatrix.test.js */
import assert from 'node:assert';
import {
  inferPeriodsForMed,
  inferDaysForMed,
  syncMedicationsFromMatrix,
  saveMatrixToStorage,
  loadMatrixFromStorage,
  DAYS,
  PERIODS
} from './smartMatrix.js';

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

// 4. Kiểm tra đồng bộ thuốc khi người dùng bớt thuốc khỏi một cữ
const meds = [
  { id: 1, name: 'Amlodipine', times: ['07:00', '15:00'] },
  { id: 2, name: 'Bisoprolol', times: ['15:00'] },
];
const mockMatrix = {};
DAYS.forEach((d) => {
  PERIODS.forEach((p) => {
    mockMatrix[`${d.key}_${p.key}`] = [];
  });
});
// Người dùng chọn Amlodipine chỉ uống buổi sáng (chỉ có trong mon_morning)
mockMatrix['mon_morning'] = [0];
const synced = syncMedicationsFromMatrix(meds, mockMatrix, {
  morning: '07:00',
  noon: '12:00',
  afternoon: '15:00',
  evening: '19:00',
});
assert.deepStrictEqual(synced[0].times, ['07:00'], 'Amlodipine chỉ còn cữ sáng sau khi gỡ khỏi buổi chiều');

// 5. Kiểm tra lưu và nạp từ localStorage (trường hợp chọn 3 thuốc trong ngăn Thứ Sáu - Buổi Chiều)
const mockStorage = {};
global.window = {
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
  },
};
global.localStorage = global.window.localStorage;

const testMeds = [
  { id: 1, name: 'Amlodipine' },
  { id: 2, name: 'Bisoprolol' },
  { id: 3, name: 'Candesartan' },
  { id: 4, name: 'Gliclazid + metformin' },
];

const matrixToSave = {};
DAYS.forEach((d) => {
  PERIODS.forEach((p) => {
    matrixToSave[`${d.key}_${p.key}`] = [0, 1, 2, 3];
  });
});
// Người dùng chỉ chọn 3 thuốc ở ngăn Thứ Sáu - Chiều (gỡ Bisoprolol ra)
matrixToSave['fri_afternoon'] = [0, 2, 3];

const saveOk = saveMatrixToStorage(matrixToSave, testMeds);
assert.strictEqual(saveOk, true, 'Lưu matrix vào localStorage thành công');

// Nạp lại khi mở lại modal (kể cả khi tham chiếu mảng thuốc thay đổi sau khi fetch)
const refetchedMeds = JSON.parse(JSON.stringify(testMeds));
const loaded = loadMatrixFromStorage(refetchedMeds);
assert.notStrictEqual(loaded, null, 'Nạp lại matrix từ localStorage không được null');
assert.deepStrictEqual(loaded.fri_afternoon, [0, 2, 3], 'Ngăn Thứ Sáu - Buổi Chiều phải giữ đúng 3 thuốc đã chọn');

console.log('  ✓ smartMatrix: tự động phân bổ và đồng bộ chính xác 28 ngăn kéo CalenDIA+');
