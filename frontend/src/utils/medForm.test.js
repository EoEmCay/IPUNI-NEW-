/* Chạy: node src/utils/medForm.test.js */
import assert from 'node:assert';
import { isInjection } from './medForm.js';

const cases = [
  [{ name: 'Lantus SoloStar', dosage: '10 UI' }, true],
  [{ name: 'Mixtard 30' }, true],
  [{ name: 'Ozempic 0.5mg' }, true],
  [{ name: 'Thuốc X', instructions: 'Tiêm dưới da buổi sáng' }, true],
  [{ name: 'Metformin 500mg', dosage: '1 viên', instructions: 'Uống sau ăn' }, false],
  [{ name: 'Gliclazide 30mg', instructions: 'Uống trước ăn 30 phút' }, false],
  [{ name: 'Glucophage' }, false],
];
for (const [med, want] of cases) {
  assert.strictEqual(isInjection(med), want, med.name);
  console.log('  ✓', med.name, want ? '-> tiêm' : '-> viên');
}
