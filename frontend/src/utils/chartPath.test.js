/* Chạy: node src/utils/chartPath.test.js */
import assert from 'node:assert';
import { monotonePath, niceStep } from './chartPath.js';

// Lấy mẫu từng đoạn Bezier, kiểm tra đường cong luôn nằm giữa 2 số đo 2 đầu đoạn
const pts = [100, 84, 180, 78, 102, 92, 250, 60].map((y, i) => ({ x: i * 40, y }));
const nums = monotonePath(pts).match(/-?\d+(\.\d+)?/g).map(Number);
const segs = nums.slice(2);
let x0 = nums[0], y0 = nums[1];
for (let i = 0; i < segs.length; i += 6) {
  const [, c1y, , c2y, x1, y1] = segs.slice(i, i + 6);
  const lo = Math.min(y0, y1) - 1e-9, hi = Math.max(y0, y1) + 1e-9;
  for (let s = 0; s <= 1; s += 0.05) {
    const y = (1 - s) ** 3 * y0 + 3 * (1 - s) ** 2 * s * c1y + 3 * (1 - s) * s ** 2 * c2y + s ** 3 * y1;
    assert(y >= lo && y <= hi, `đoạn ${i / 6}: y=${y.toFixed(1)} vượt ngoài [${y0}, ${y1}]`);
  }
  x0 = x1; y0 = y1;
}
assert.strictEqual(monotonePath([{ x: 5, y: 7 }]), 'M5,7');
assert.strictEqual(niceStep(300), 100);
assert.strictEqual(niceStep(15), 5);
assert.strictEqual(niceStep(230), 100);
console.log('  ✓ chartPath: đường cong không vượt quá số đo thật');
