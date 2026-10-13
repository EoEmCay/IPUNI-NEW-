'use strict';
const assert = require('assert');
const careService = require('./care.service');
const db = require('../../config/database');

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

  console.log('ALL CARE & INSIGHTS INTEGRATION TESTS PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Care test failed:', err);
  process.exit(1);
});
