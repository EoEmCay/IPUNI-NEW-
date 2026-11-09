'use strict';
const assert = require('assert');
const careService = require('./care.service');
const db = require('../../config/database');
const { vnWallToInstant } = require('../medications/medicationSchedule');
const memoryCache = require('../../utils/memoryCache');

async function runTests() {
  console.log('--- Running Care & Insights Integration Tests ---');

  // Find or create test patient
  let testUser = await db('users').where({ email: 'khoi@example.com' }).first();
  if (!testUser) {
    testUser = await db('users').first();
  }
  if (!testUser) {
    console.log('No user found in DB, skipping DB integration test.');
    return;
  }

  // 1. Test getTimeline
  const timeline = await careService.getTimeline(testUser.id);
  assert.ok(timeline.date);
  assert.ok(timeline.patient_name);
  assert.ok(['stable', 'needs_attention', 'danger'].includes(timeline.overall_status));
  assert.ok(Array.isArray(timeline.items));
  console.log(`✓ getTimeline returned ${timeline.items.length} events for ${timeline.patient_name} (Status: ${timeline.overall_status})`);

  // 2. Test getWeeklyInsights
  const weekly = await careService.getWeeklyInsights(testUser.id);
  assert.ok(weekly.title);
  assert.ok(Array.isArray(weekly.lines));
  assert.ok(weekly.stats);
  console.log(`✓ getWeeklyInsights returned: "${weekly.title}" with ${weekly.lines.length} summary lines`);

  // 3. Test getDoctorBriefing
  const docBrief = await careService.getDoctorBriefing(testUser.id);
  assert.ok(docBrief.patient);
  assert.ok(docBrief.adherence);
  assert.ok(docBrief.glucose_profile);
  assert.ok(Array.isArray(docBrief.active_medications));
  console.log(`✓ getDoctorBriefing prepared complete 30-day dossier for Dr. consultation`);

  // 4. Test Case: Cữ sáng sớm trước 07:00 sáng VN & Đường huyết 05:30 sáng VN
  console.log('--- Test Case 4: Early morning dose (06:00 VN) & Fasting glucose (05:30 VN) ---');
  memoryCache.clear();
  const targetDateStr = '2026-11-09';
  const createdMedIds = [];
  const createdLogIds = [];
  const createdMetricIds = [];

  try {
    // Tạo thuốc uống lúc 06:00 sáng
    const [medEarlyId] = await db('medications').insert({
      user_id: testUser.id,
      name: 'Thuốc Sáng Sớm Test',
      dosage: '1 viên',
      frequency: 'Hàng ngày',
      schedule_type: 'daily',
      times: JSON.stringify(['06:00']),
      is_active: 1,
    });
    createdMedIds.push(medEarlyId);

    // Mốc 06:00 sáng VN (2026-11-09 06:00 VN = 2026-11-08 23:00 UTC)
    // Lưu ý tháng trong JS Date là 0-indexed: tháng 11 là m = 10
    const earlyDoseInstant = vnWallToInstant(2026, 10, 9, 6, 0);
    const [logEarlyId] = await db('medication_logs').insert({
      user_id: testUser.id,
      medication_id: medEarlyId,
      scheduled_for: earlyDoseInstant.toISOString(),
      slot_time: '06:00',
      status: 'taken',
      taken_at: earlyDoseInstant.toISOString(),
    });
    createdLogIds.push(logEarlyId);

    // Đường huyết đo lúc 05:30 sáng VN (2026-11-08 22:30 UTC)
    const earlyGlucoseInstant = vnWallToInstant(2026, 10, 9, 5, 30);
    const [metricId] = await db('metrics').insert({
      user_id: testUser.id,
      measurement_type: 'glucose_fasting',
      measurement_category: 'glucose',
      value: 5.8,
      unit: 'mmol/L',
      measured_at: earlyGlucoseInstant.toISOString(),
    });
    createdMetricIds.push(metricId);

    const tlEarly = await careService.getTimeline(testUser.id, targetDateStr);
    const earlyMedItem = tlEarly.items.find((i) => i.medication_id === medEarlyId);
    const earlyGlucoseItem = tlEarly.items.find((i) => i.id === `glucose-${metricId}`);

    assert.ok(earlyMedItem, 'Cữ thuốc 06:00 sáng VN phải xuất hiện trong timeline ngày 2026-11-09');
    assert.strictEqual(earlyMedItem.status, 'taken', 'Cữ 06:00 sáng VN phải có trạng thái taken');
    assert.strictEqual(earlyMedItem.time, '06:00', 'Giờ hiển thị cữ thuốc phải là 06:00');

    assert.ok(earlyGlucoseItem, 'Đường huyết đo lúc 05:30 sáng VN phải xuất hiện trong timeline ngày 2026-11-09');
    assert.strictEqual(earlyGlucoseItem.time, '05:30', 'Giờ hiển thị đường huyết phải là 05:30');
    console.log('✓ Test Case 4 PASSED: Cữ trước 07:00 sáng VN & đường huyết 05:30 không bị lệch sang ngày hôm trước.');

    // 5. Test Case: Thuốc 3 cữ (08:00, 12:00, 20:00), CHỈ uống cữ 08:00
    console.log('--- Test Case 5: 3 doses/day medication, only 1 dose taken ---');
    memoryCache.clear();
    const [medMultiId] = await db('medications').insert({
      user_id: testUser.id,
      name: 'Thuốc 3 Cữ Test',
      dosage: '1 viên',
      frequency: '3 lần/ngày',
      schedule_type: 'daily',
      times: JSON.stringify(['08:00', '12:00', '20:00']),
      is_active: 1,
    });
    createdMedIds.push(medMultiId);

    // Chỉ log cữ 08:00 là taken
    const dose08Instant = vnWallToInstant(2026, 10, 9, 8, 0);
    const [log08Id] = await db('medication_logs').insert({
      user_id: testUser.id,
      medication_id: medMultiId,
      scheduled_for: dose08Instant.toISOString(),
      slot_time: '08:00',
      status: 'taken',
      taken_at: dose08Instant.toISOString(),
    });
    createdLogIds.push(log08Id);

    const tlMulti = await careService.getTimeline(testUser.id, targetDateStr);
    const dose08Item = tlMulti.items.find((i) => i.id === `med-${medMultiId}-08:00`);
    const dose12Item = tlMulti.items.find((i) => i.id === `med-${medMultiId}-12:00`);
    const dose20Item = tlMulti.items.find((i) => i.id === `med-${medMultiId}-20:00`);

    assert.ok(dose08Item, 'Cữ 08:00 phải có trong timeline');
    assert.strictEqual(dose08Item.status, 'taken', 'Cữ 08:00 phải là taken vì đã có log xác nhận');

    assert.ok(dose12Item, 'Cữ 12:00 phải có trong timeline');
    assert.notStrictEqual(dose12Item.status, 'taken', 'Cữ 12:00 KHÔNG ĐƯỢC là taken (chưa có log)');

    assert.ok(dose20Item, 'Cữ 20:00 phải có trong timeline');
    assert.notStrictEqual(dose20Item.status, 'taken', 'Cữ 20:00 KHÔNG ĐƯỢC là taken (chưa có log)');

    console.log('✓ Test Case 5 PASSED: Thuốc nhiều cữ trong ngày không bị gán nhầm trạng thái taken hàng loạt.');
  } finally {
    // Dọn dẹp dữ liệu kiểm thử
    if (createdLogIds.length) await db('medication_logs').whereIn('id', createdLogIds).del();
    if (createdMetricIds.length) await db('metrics').whereIn('id', createdMetricIds).del();
    if (createdMedIds.length) await db('medications').whereIn('id', createdMedIds).del();
    memoryCache.clear();
  }

  console.log('ALL 5 CARE TESTS PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Care test failed:', err);
  process.exit(1);
});
