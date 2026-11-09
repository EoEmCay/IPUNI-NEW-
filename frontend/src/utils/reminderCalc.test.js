import assert from 'node:assert/strict';
import {
  groupDosesForNotification,
  timeSlotNotifId,
  buildTodayInstant,
} from './reminderCalc.js';

console.log('Testing reminderCalc logic...');

// 1. Test buildTodayInstant
const today7am = buildTodayInstant('07:00');
assert.ok(today7am, 'buildTodayInstant phải trả về chuỗi ISO');
assert.ok(today7am.includes(':00.000Z'), 'ISO instant phải có format hợp lệ');

// 2. Test timeSlotNotifId
const id1 = timeSlotNotifId('2026-11-10T07:00:00.000Z', false);
const id1Followup = timeSlotNotifId('2026-11-10T07:00:00.000Z', true);
assert.ok(typeof id1 === 'number' && id1 >= 0, 'ID phải là số nguyên dương');
assert.ok(typeof id1Followup === 'number' && id1Followup >= 100000000, 'Followup ID phải tách biệt');
assert.notEqual(id1, id1Followup, 'ID chính và ID nhắc lại không được trùng nhau');

// 3. Test groupDosesForNotification với dữ liệu thật từ Backend (scheduledFor & slotTime)
const baseTime = Date.now();
const futureTime1 = new Date(baseTime + 2 * 3600 * 1000).toISOString(); // 2 tiếng sau
const futureTime2 = new Date(baseTime + 6 * 3600 * 1000).toISOString(); // 6 tiếng sau
const pastTime = new Date(baseTime - 1 * 3600 * 1000).toISOString(); // 1 tiếng trước

const sampleDoses = [
  // Cữ 1: Hai thuốc cùng giờ futureTime1
  {
    medicationId: 1,
    name: 'Metformin',
    dosage: '500mg',
    scheduledFor: futureTime1,
    slotTime: '08:00',
  },
  {
    medicationId: 2,
    name: 'Gliclazide',
    dosage: '30mg',
    scheduledFor: futureTime1,
    slotTime: '08:00',
  },
  // Cữ 2: Một thuốc giờ futureTime2 (kiểm tra fallback sang instant)
  {
    medicationId: 3,
    name: 'Lantus',
    dosage: '10UI',
    instant: futureTime2,
    slot: '20:00',
  },
  // Cữ 3: Đã qua (quá khứ) -> phải bị loại bỏ
  {
    medicationId: 4,
    name: 'Thuốc cũ',
    dosage: '1 viên',
    scheduledFor: pastTime,
    slotTime: '06:00',
  },
];

const items = groupDosesForNotification(sampleDoses, baseTime);

// Phải sinh 2 cữ hợp lệ, mỗi cữ có 1 thông báo chính + 1 thông báo nhắc lại sau 15p = tổng 4 items
assert.equal(items.length, 4, 'Phải có 4 items thông báo (2 chính + 2 followup)');

// Kiểm tra cữ gộp 2 thuốc
const group1Main = items.find((i) => i.extra.instant === futureTime1 && !i.extra.isFollowup);
assert.ok(group1Main, 'Phải có thông báo chính cho cữ 08:00');
assert.equal(group1Main.title, 'Đến giờ uống thuốc (cữ 08:00)');
assert.ok(group1Main.body.includes('Metformin 500mg') && group1Main.body.includes('Gliclazide 30mg'), 'Nội dung phải gộp 2 thuốc');
assert.equal(group1Main.channelId, 'medication_reminders');

// Kiểm tra thông báo nhắc lại sau 15 phút
const group1Followup = items.find((i) => i.extra.instant === futureTime1 && i.extra.isFollowup);
assert.ok(group1Followup, 'Phải có thông báo nhắc lại sau 15p cho cữ 08:00');
const expectedFollowupTime = new Date(new Date(futureTime1).getTime() + 15 * 60000).getTime();
assert.equal(group1Followup.schedule.at.getTime(), expectedFollowupTime, 'Thời gian nhắc lại phải đúng sau 15 phút');

// Kiểm tra thuốc đơn lẻ
const group2Main = items.find((i) => i.extra.instant === futureTime2 && !i.extra.isFollowup);
assert.ok(group2Main, 'Phải hỗ trợ fallback trường instant/slot');
assert.equal(group2Main.body, 'Lantus 10UI — cữ 20:00');

console.log('✓ reminderCalc tests passed successfully!');
