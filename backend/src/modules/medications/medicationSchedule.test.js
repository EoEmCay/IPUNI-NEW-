/* Chạy: node src/modules/medications/medicationSchedule.test.js  (không cần framework) */
'use strict';
const assert = require('assert');
const S = require('./medicationSchedule');

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

console.log('medicationSchedule');

it('daily: mọi ngày đều là ngày uống', () => {
  const med = { schedule_type: 'daily', times: '["08:00","20:00"]' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 1, d: 28 }), true);
  assert.strictEqual(S.expectedDosesOnDay(med, { y: 2026, m: 1, d: 28 }), 2);
});

it('cách ngày (every_n_days=2): đúng chẵn/lẻ theo mốc anchor', () => {
  const med = { schedule_type: 'every_n_days', every_n_days: 2, anchor_date: '2026-03-01', times: '["09:00"]' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 2, d: 1 }), true);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 2, d: 2 }), false);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 2, d: 3 }), true);
});

it('cách ngày qua GIAO THỪA + đổi năm', () => {
  const med = { schedule_type: 'every_n_days', every_n_days: 2, anchor_date: '2025-12-30', times: '["07:00"]' };
  assert.strictEqual(S.isDoseDay(med, { y: 2025, m: 11, d: 30 }), true);
  assert.strictEqual(S.isDoseDay(med, { y: 2025, m: 11, d: 31 }), false);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 0, d: 1 }), true);
});

it('năm nhuận: 29/02/2028 tính đúng khoảng cách ngày', () => {
  const med = { schedule_type: 'every_n_days', every_n_days: 3, anchor_date: '2028-02-27', times: '["08:00"]' };
  assert.strictEqual(S.dayDiff({ y: 2028, m: 1, d: 27 }, { y: 2028, m: 2, d: 1 }), 3);
  assert.strictEqual(S.isDoseDay(med, { y: 2028, m: 2, d: 1 }), true);
});

it('GLP-1 hàng tuần (every_n_days=7): chỉ đúng 1 ngày/tuần', () => {
  const med = { schedule_type: 'every_n_days', every_n_days: 7, anchor_date: '2026-08-03', times: '["08:00"]' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 10 }), true);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 11 }), false);
});

it('theo thứ trong tuần: [1,3,5] = T2/T4/T6', () => {
  const med = { schedule_type: 'days_of_week', days_of_week: '[1,3,5]', times: '["08:00"]' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 31 }), true); // 31/08/2026 = Thứ 2
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 8, d: 1 }), false);
});

it('lệch múi giờ: liều 22:00 VN = 15:00 UTC cùng ngày', () => {
  const doses = S.enumerateDoses(
    { schedule_type: 'daily', times: '["22:00"]' },
    new Date('2026-08-28T00:00:00Z'),
    new Date('2026-08-28T23:59:59Z'),
  );
  assert.strictEqual(doses.length, 1);
  assert.strictEqual(doses[0].instant.toISOString(), '2026-08-28T15:00:00.000Z');
});

it('cữ Sáng/Trưa/Chiều/Tối từ slots', () => {
  const t = S.resolveTimes({ slots: '["morning","noon","evening"]' });
  assert.deepStrictEqual(t, ['08:00', '12:00', '19:00']);
});

it('as_needed: không sinh liều, không tính tuân thủ', () => {
  const med = { schedule_type: 'as_needed', times: '["08:00"]' };
  assert.strictEqual(S.expectedDosesOnDay(med, { y: 2026, m: 1, d: 1 }), 0);
  assert.strictEqual(
    S.enumerateDoses(med, new Date('2026-01-01T00:00:00Z'), new Date('2026-01-31T00:00:00Z')).length,
    0,
  );
});

it('dữ liệu cũ: frequency "cách ngày" được suy luận đúng', () => {
  const med = { frequency: 'Uống cách ngày, buổi sáng', times: '["08:00"]', prescribed_at: '2026-08-01' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 1 }), true);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 2 }), false);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 3 }), true);
});

it('end_date: sau ngày kết thúc thì không còn liều', () => {
  const med = { schedule_type: 'daily', times: '["08:00"]', end_date: '2026-08-10' };
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 10 }), true);
  assert.strictEqual(S.isDoseDay(med, { y: 2026, m: 7, d: 11 }), false);
});

console.log(`\n${pass} test passed.`);
