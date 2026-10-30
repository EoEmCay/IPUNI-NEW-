'use strict';
// Chạy: node src/services/careEvents.test.js  (dùng SQLite tạm, không đụng DB thật)
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(os.tmpdir(), `careevents-test-${process.pid}.sqlite`);
process.env.SQLITE_PATH = dbFile;
process.env.NODE_ENV = 'development';
delete process.env.DATABASE_URL;

const db = require('../config/database');
const events = require('./careEvents.service');
const adherence = require('../modules/medications/adherence.service');
const analytics = require('../modules/analytics/analytics.service');
const careLinks = require('../modules/users/careLinks.service');

(async () => {
  await db.migrate.latest();

  // --- Bảng số liệu rỗng phải trả về 0, không còn số gõ cứng/ngẫu nhiên
  const empty = await analytics.getOverview();
  assert.equal(empty.pageViews, 0);
  assert.equal(empty.realUsers, 0);
  assert.equal(empty.totalScans, 0);
  const ch = await analytics.getCharts(7);
  assert.equal(ch.timeseries.views.length, 7);
  assert.ok(ch.timeseries.views.every((d) => d.count === 0), 'biểu đồ rỗng phải toàn 0');

  // --- dữ liệu mẫu
  const [patientId] = await db('users').insert({ email: 'bn@test.vn', name: 'BN', password_hash: 'x', user_code: 'TESTBN01' });
  const [familyId] = await db('users').insert({ email: 'nn@test.vn', name: 'NN', password_hash: 'x', user_code: 'TESTNN01' });
  const [medId] = await db('medications').insert({
    user_id: patientId, name: 'Thuốc thử', dosage: '1 viên', frequency: 'daily', times: JSON.stringify(['08:00']), is_active: 1,
  });
  const when = new Date(Date.now() - 20 * 60000).toISOString();

  // --- dose_confirmed: lần đầu ghi 1 sự kiện, bấm lại cùng cữ không ghi thêm
  await adherence.logDose(patientId, medId, { status: 'taken', scheduledFor: when }, { channel: 'telegram' });
  await adherence.logDose(patientId, medId, { status: 'taken', scheduledFor: when }, { channel: 'telegram' });
  let rows = await db('care_events').where({ event_type: 'dose_confirmed' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].channel, 'telegram');
  assert.equal(rows[0].user_id, patientId);
  assert.ok(!JSON.stringify(rows[0]).includes('Thuốc thử'), 'không được lưu tên thuốc');

  // bỏ qua cữ thì không tính là xác nhận
  await adherence.logDose(patientId, medId, { status: 'skipped', scheduledFor: new Date(Date.now() - 3600000).toISOString() });
  assert.equal((await db('care_events').where({ event_type: 'dose_confirmed' })).length, 1);

  // --- recordSend: kênh chưa cấu hình không bị tính là gửi lỗi
  await events.recordSend(events.EVENT.REMINDER_SENT, { userId: patientId, channel: 'telegram' }, { sent: false, reason: 'not_configured' });
  await events.recordSend(events.EVENT.REMINDER_SENT, { userId: patientId, channel: 'telegram' }, { sent: true });
  await events.recordSend(events.EVENT.REMINDER_SENT, { userId: patientId, channel: 'zns' }, { sent: false, reason: 'rejected' });
  rows = await db('care_events').where({ event_type: 'reminder_sent' });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.status).sort(), ['failed', 'ok']);

  // --- báo người nhà đã gửi + đã biết (chỉ đếm lần đầu)
  const [alertId] = await db('clinical_alerts').insert({
    patient_id: patientId, type: 'missed_dose', severity: 'warning', title: 't', detail: 'd', dedupe_key: 'k1',
  });
  await db('care_links').insert({ patient_id: patientId, member_id: familyId, relation: 'family_account', status: 'active' });
  await events.recordSend(events.EVENT.CAREGIVER_ALERT_SENT, { userId: patientId, actorId: familyId, alertId, channel: 'telegram' }, { sent: true });
  await careLinks.ackFamilyAlert(familyId, alertId);
  await careLinks.ackFamilyAlert(familyId, alertId);
  assert.equal((await db('care_events').where({ event_type: 'caregiver_alert_acked' })).length, 1);

  // --- phễu
  const f = await events.getFunnel(7);
  assert.equal(f.reminders.sent, 1);
  assert.equal(f.reminders.failed, 1);
  assert.equal(f.doses.confirmed, 1);
  assert.equal(f.caregiverAlerts.distinctAlertsSent, 1);
  assert.equal(f.caregiverAlerts.distinctAlertsAcked, 1);
  assert.equal(f.caregiverAlerts.ackRatePct, 100);
  assert.equal(f.doses.telegramConfirmRatePct, 100);

  // --- số liệu thật sau khi có dữ liệu
  const ov = await analytics.getOverview();
  assert.equal(ov.realUsers, 2);
  assert.equal(ov.totalMedications, 1);

  // --- record không bao giờ throw dù DB lỗi
  await db.schema.dropTable('care_events');
  await events.record({ type: 'x', userId: 1 });

  console.log('careEvents.test.js: all passed');
})().catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await db.destroy(); try { fs.rmSync(dbFile, { force: true }); fs.rmSync(`${dbFile}-wal`, { force: true }); fs.rmSync(`${dbFile}-shm`, { force: true }); } catch { /* */ } });
