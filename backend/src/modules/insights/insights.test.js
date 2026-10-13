'use strict';
const assert = require('assert');
const {
  partOfDay,
  slotLabel,
  adherence,
  adherenceByMed,
  findMissPatterns,
  glucoseStats,
  buildWeeklyText,
} = require('./insights.logic');

console.log('--- Running Insights Logic Tests ---');

// 1. partOfDay and slotLabel
assert.strictEqual(partOfDay('07:00'), 'sáng');
assert.strictEqual(partOfDay('12:30'), 'trưa');
assert.strictEqual(partOfDay('17:00'), 'chiều');
assert.strictEqual(partOfDay('20:00'), 'tối');
assert.strictEqual(slotLabel(6, '21:00'), 'cữ tối thứ Bảy (21:00)');
console.log('✓ partOfDay & slotLabel passed');

// 2. adherence & adherenceByMed
const sampleDoses = [
  { medName: 'Metformin', dateStr: '2026-10-01', dow: 4, slot: '07:00', taken: true },
  { medName: 'Metformin', dateStr: '2026-10-01', dow: 4, slot: '19:00', taken: true },
  { medName: 'Gliclazide', dateStr: '2026-10-01', dow: 4, slot: '07:00', taken: false },
  { medName: 'Gliclazide', dateStr: '2026-10-02', dow: 5, slot: '07:00', taken: true },
];

const totalAdherence = adherence(sampleDoses);
assert.strictEqual(totalAdherence.expected, 4);
assert.strictEqual(totalAdherence.taken, 3);
assert.strictEqual(totalAdherence.percent, 75);

const byMed = adherenceByMed(sampleDoses);
const metforminStat = byMed.find(m => m.name === 'Metformin');
assert.strictEqual(metforminStat.percent, 100);
const gliclazideStat = byMed.find(m => m.name === 'Gliclazide');
assert.strictEqual(gliclazideStat.percent, 50);
console.log('✓ adherence & adherenceByMed passed');

// 3. findMissPatterns: recurring missed doses on the same day-of-week and slot
// Construct 4 weeks of Saturday evening doses (dow = 6, slot = '20:00')
const dosesWithPattern = [];
for (let week = 1; week <= 4; week++) {
  dosesWithPattern.push({
    medName: 'Metformin',
    dateStr: `2026-10-0${week}`,
    dow: 6,
    slot: '20:00',
    taken: week === 1, // missed in weeks 2, 3, 4 (3 missed out of 4)
  });
  // Normal morning doses that were taken
  dosesWithPattern.push({
    medName: 'Metformin',
    dateStr: `2026-10-0${week}`,
    dow: 6,
    slot: '07:00',
    taken: true,
  });
}

const patterns = findMissPatterns(dosesWithPattern, { minMissed: 3, minRatio: 0.6 });
assert.strictEqual(patterns.length, 1);
assert.strictEqual(patterns[0].dow, 6);
assert.strictEqual(patterns[0].slot, '20:00');
assert.strictEqual(patterns[0].missed, 3);
assert.strictEqual(patterns[0].total, 4);
assert.strictEqual(patterns[0].label, 'cữ tối thứ Bảy (20:00)');
console.log('✓ findMissPatterns correctly identified recurring missed doses');

// 4. glucoseStats: low, normal, very high thresholds
const sampleReadings = [
  { value: 3.5, measured_at: '2026-10-01T07:00:00Z' }, // LOW (< 3.9)
  { value: 5.8, measured_at: '2026-10-01T12:00:00Z' }, // In-range
  { value: 7.2, measured_at: '2026-10-02T07:00:00Z' }, // In-range
  { value: 14.5, measured_at: '2026-10-02T19:00:00Z' }, // VERY HIGH (> 13.9)
];

const gStats = glucoseStats(sampleReadings);
assert.strictEqual(gStats.count, 4);
assert.strictEqual(gStats.average, 7.8);
assert.strictEqual(gStats.timeInRangePercent, 50); // 2 out of 4 in range [3.9 - 10.0]
assert.strictEqual(gStats.lows.length, 1);
assert.strictEqual(gStats.highs.length, 1);
console.log('✓ glucoseStats passed boundary tests');

// 5. buildWeeklyText: natural Vietnamese weekly digest
const weeklyDigest = buildWeeklyText({
  name: 'Bác Ba',
  week: { expected: 14, taken: 12, percent: 86 },
  prevWeek: { percent: 78 },
  missedDoses: [{ medName: 'Metformin', dateStr: '2026-10-03', slot: '20:00' }],
  patterns,
  glucose: gStats,
  toVnDateStr: (d) => '03/10',
});

assert.strictEqual(weeklyDigest.title, 'Bản tin tuần của Bác Ba');
assert.ok(weeklyDigest.lines.some(l => l.includes('86%') && l.includes('tốt hơn')));
assert.ok(weeklyDigest.lines.some(l => l.includes('cữ tối thứ Bảy (20:00)')));
assert.ok(weeklyDigest.lines.some(l => l.includes('đường huyết thấp')));
console.log('✓ buildWeeklyText generated complete structured digest');

console.log('ALL 5 INSIGHTS TESTS PASSED!');
