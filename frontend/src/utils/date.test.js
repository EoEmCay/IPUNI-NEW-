/* Chạy: node src/utils/date.test.js (tự đặt giờ VN) */
import assert from 'node:assert';
import { localYmd } from './date.js';

process.env.TZ = 'Asia/Ho_Chi_Minh';
// 06:30 sáng 08/10 giờ VN = 23:30 ngày 07/10 UTC -> phải ra ngày 08 (lỗi cũ ra 07)
assert.strictEqual(localYmd(new Date('2026-10-08T06:30:00+07:00')), '2026-10-08');
assert.strictEqual(localYmd(new Date('2026-10-08T23:59:00+07:00')), '2026-10-08');
assert.strictEqual(localYmd('2026-01-01T00:00:00+07:00'), '2026-01-01');
console.log('date.test.js OK');
