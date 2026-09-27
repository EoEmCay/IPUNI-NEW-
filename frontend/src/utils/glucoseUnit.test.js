/* Chạy: node src/utils/glucoseUnit.test.js */
import assert from 'node:assert';
import { formatGlucose, toMmol } from './glucoseUnit.js';

assert.strictEqual(formatGlucose(5.1, 'mg/dL'), '92');
assert.strictEqual(formatGlucose(10, 'mg/dL'), '180');
assert.strictEqual(formatGlucose(6.25, 'mmol/L'), '6.3');
assert.strictEqual(formatGlucose(null, 'mmol/L'), '--');
assert.strictEqual(toMmol(126, 'mg/dL'), 6.99);
assert.strictEqual(toMmol(6.5, 'mmol/L'), 6.5);
// đi một vòng mg/dL -> mmol -> mg/dL giữ nguyên số người dùng gõ
for (const mg of [54, 70, 92, 126, 180, 250, 400]) assert.strictEqual(formatGlucose(toMmol(mg, 'mg/dL'), 'mg/dL'), String(mg));
console.log('  ✓ glucoseUnit');
