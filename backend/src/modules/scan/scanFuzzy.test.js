/* Chạy: node src/modules/scan/scanFuzzy.test.js  (không cần framework, không gọi AI) */
'use strict';
const assert = require('assert');
const { shapeResult, findMedicationInDatabase } = require('./scan.service');

let pass = 0;
const it = (name, fn) => {
  try {
    fn();
    pass++;
    console.log('  ✓', name);
  } catch (e) {
    console.error('  ✗', name, '\n     ', e.message);
    process.exitCode = 1;
  }
};
const shape = (name, dosage = '2mg') => shapeResult({ medications: [{ name, dosage }] }).medications[0];

console.log('scan fuzzy matching');

it('tên đọc méo được sửa về tên thuốc ĐTĐ đúng', () => {
  assert.strictEqual(shape('Glimpirid 2mg').name, 'Glimepiride 2mg');
  assert.strictEqual(shape('Glimpirid 2mg').nameAsRead, 'Glimpirid 2mg');
  assert.strictEqual(shape('Glicazid').name, 'Gliclazide');
  assert.strictEqual(findMedicationInDatabase('Metfornin').name, 'metformin');
});

it('không kéo thuốc khác về thuốc gần giống trong DB', () => {
  assert.strictEqual(shape('Rosuvastatin').name, 'Rosuvastatin');
  assert.strictEqual(findMedicationInDatabase('Rosuvastatin'), null);
  assert.strictEqual(shape('Glipizide').name, 'Glipizide');
  assert.strictEqual(findMedicationInDatabase('Glipizide'), null);
});

it('biệt dược có hậu tố vẫn tra được DB', () => {
  assert.strictEqual(findMedicationInDatabase('Diamicron MR 30mg').name, 'gliclazide');
  assert.strictEqual(findMedicationInDatabase('Lantus').name, 'insulin');
});

it('cảnh báo liều insulin đọc sai (U -> 0, mg)', () => {
  assert.match(shape('Lantus', '180 IU').dosageWarning, /cao bất thường/);
  assert.match(shape('Lantus', '18 mg').dosageWarning, /ĐƠN VỊ/);
  assert.strictEqual(shape('Lantus', '18 IU').dosageWarning, null);
  assert.match(shape('Lantus', '100 IU/ml').dosageWarning, /nồng độ/);
});

it('đường dùng: insulin/GLP-1 -> tiêm dưới da, viên -> uống, AI trả sẵn thì giữ', () => {
  assert.strictEqual(shape('Insulin 30/70', '30/70').route, 'tiêm dưới da');
  assert.strictEqual(shape('Ozempic', '0.5mg').route, 'tiêm dưới da');
  assert.strictEqual(shape('Glucophage', '500mg').route, 'uống');
  assert.strictEqual(shapeResult({ medications: [{ name: 'Kem X', route: 'bôi' }] }).medications[0].route, 'bôi');
});

it('đơn không ghi liều: xoá liều AI tự điền', () => {
  const m = shapeResult({ medications: [{ name: 'Glucophage', dosage: '850mg', times: ['07:00'], instructions: 'Chưa ghi liều - hỏi lại bác sĩ/dược sĩ' }] }).medications[0];
  assert.strictEqual(m.dosage, null);
  assert.deepStrictEqual(m.times, []);
});

it('lời dặn chỉ hiện chữ đánh máy, bỏ chữ tay AI đọc không ra', () => {
  const r = shapeResult({
    doctorNotes: 'LỜI DẶN: Khám lại xin mang theo đơn này; Fusc (?)',
    handwrittenLines: ['Fusc (?)', 'asm', 'fuce', 'st', 'f 8y'],
    medications: [{ name: 'Insulin 30/70', instructions: 'Tiêm dưới da', handwritten: true }],
  });
  assert.strictEqual(r.doctorNotes, 'Khám lại xin mang theo đơn này');
  assert.strictEqual(r.medications.length, 1); // thuốc viết tay vẫn giữ trong danh sách thuốc
  // Chỉ có chữ tay, không có lời dặn in -> không hiện lời dặn
  assert.strictEqual(shapeResult({ handwrittenLines: ['asm'], medications: [{ name: 'Glucophage', handwritten: true }] }).doctorNotes, null);
});

console.log(`\n${pass} passed`);

it('đơn bệnh khác (không phải tiểu đường) vẫn được nhận để lên lịch', () => {
  // AI lỡ từ chối vì "không liên quan tiểu đường" nhưng vẫn đọc ra thuốc -> vẫn nhận.
  const r = shapeResult({
    isPrescription: false, isDiabetesPrescription: false, diagnosis: 'Tăng huyết áp',
    rejectionReason: 'Không liên quan tiểu đường',
    medications: [{ name: 'Amlodipine', dosage: '5mg', times: ['07:00'] }],
  });
  assert.strictEqual(r.isPrescription, true);
  assert.strictEqual(r.isDiabetesPrescription, true); // client cũ dựa vào cờ này để mở bước lên lịch
  assert.strictEqual(r.medications.length, 1);
  assert.strictEqual(r.rejectionReason, null);
});

it('phiếu xét nghiệm (không phải đơn) vẫn bị loại', () => {
  const r = shapeResult({ isPrescription: false, isLabReport: true, medications: [{ name: 'HbA1c', dosage: '7.2%' }] });
  assert.strictEqual(r.isPrescription, false);
  assert.strictEqual(r.medications.length, 0);
});
