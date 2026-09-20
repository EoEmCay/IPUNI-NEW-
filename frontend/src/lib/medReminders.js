/**
 * Lên lịch nhắc uống thuốc bằng Local Notification (Capacitor) — chạy CẢ KHI app đóng.
 *
 * Tính năng nâng cao:
 * 1. GỘP CÁC THUỐC CÙNG GIỜ VÀO 1 THÔNG BÁO DUY NHẤT (tránh spam nhiều thông báo cùng lúc).
 * 2. TỰ ĐỘNG NHẮC LẠI SAU 15 PHÚT (Follow-up Snooze) nếu chưa xác nhận.
 * 3. BẬT ÂM THANH CHUÔNG HỆ THỐNG & RUNG (Sound: default, High priority).
 * 4. TÍCH HỢP GIỌNG ĐỌC "CHỊ GOOGLE" (Google TTS tiếng Việt) khi mở/chạm thông báo.
 */
import { isNative, blinkFlash } from './native';
import { medicationsService } from '../services/medications.service';
import { voiceAlertService, ALERT_TYPES } from '../services/voiceAlert.service';

const STORE_KEY = 'diaplus_reminder_ids';
const MAX_SCHEDULED = 60; // Giới hạn iOS (tối đa 64 local notifications chờ)

let listenersRegistered = false;

function loadIds() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
function saveIds(ids) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

/** Tạo id thông báo duy nhất trong khoảng int32 dương từ mốc thời gian */
function timeSlotNotifId(instantIso, isFollowup = false) {
  const epochMins = Math.floor(new Date(instantIso).getTime() / 60000);
  const base = Math.abs(epochMins % 100000000);
  return isFollowup ? (base + 100000000) : base;
}

// Việt Nam dùng offset UTC+7 CỐ ĐỊNH (không DST) — PHẢI khớp chính xác với công thức
// backend/src/modules/medications/medicationSchedule.js (vnWallToInstant), để instant tính
// ra ở đây trùng khớp tuyệt đối với instant đã dùng lúc đặt lịch trong syncMedicationReminders().
const VN_OFFSET_MIN = 420;

/**
 * Quy đổi 1 giờ uống dạng 'HH:mm' thành ISO instant của cữ đó trong NGÀY HÔM NAY (giờ VN),
 * bất kể múi giờ hệ điều hành của thiết bị đang đặt là gì.
 * @param {string} slotTime Ví dụ '07:00'
 * @param {Date} [dateObj] Thời điểm hiện tại (mặc định: bây giờ)
 * @returns {string|null} ISO instant, hoặc null nếu slotTime không hợp lệ
 */
export function buildTodayInstant(slotTime, dateObj = new Date()) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(slotTime || '').trim());
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  // Quy đổi "bây giờ" sang ngày lịch VN trước khi lấy Y-M-D, tránh lệch ngày khi thiết bị
  // đặt múi giờ khác VN (ví dụ đang là 23h50 giờ VN nhưng máy để giờ UTC thì vẫn là "hôm nay" ở VN).
  const shifted = new Date(dateObj.getTime() + VN_OFFSET_MIN * 60000);
  const y = shifted.getUTCFullYear();
  const mo = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  return new Date(Date.UTC(y, mo, d, hh, mm, 0) - VN_OFFSET_MIN * 60000).toISOString();
}

/**
 * Huỷ thông báo NHẮC LẠI (Lần 2, sau 15 phút) của một cữ thuốc cụ thể — gọi ngay khi bệnh
 * nhân xác nhận đã uống (hoặc bỏ qua có lý do) để máy không đổ chuông oan 15 phút sau.
 * @param {string} instantIso Thời điểm cữ thuốc (giờ uống gốc, KHÔNG phải giờ nhắc lại)
 */
export async function cancelFollowupReminder(instantIso) {
  if (!isNative || !instantIso) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const id = timeSlotNotifId(instantIso, true);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (e) {
    console.warn('[medReminders] Không thể huỷ thông báo nhắc lại:', e);
  }
}

export async function ensureNotificationPermission() {
  if (!isNative) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
      perm = await LocalNotifications.requestPermissions();
    }
    return perm.display === 'granted';
  } catch {
    return false;
  }
}

/** Thiết lập kênh thông báo âm thanh cao và bộ lắng nghe sự kiện */
export async function setupReminderListeners() {
  if (!isNative || listenersRegistered) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Tạo kênh thông báo ưu tiên cao trên Android (đổ chuông, rung, heads-up banner)
    await LocalNotifications.createChannel({
      id: 'medication_reminders',
      name: 'Nhắc nhở uống thuốc DIA+',
      description: 'Âm thanh chuông báo và nhắc nhở cữ thuốc đúng giờ',
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#0284c7'
    }).catch(() => {});

    // Khi nhận thông báo lúc app đang mở -> nháy đèn flash + phát giọng đọc
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      blinkFlash(4, 0.15);
      const medNames = notification.extra?.medNames || [];
      voiceAlertService.playAlert(ALERT_TYPES.MED_ALL, medNames);
    });

    // Khi người dùng bấm vào thông báo trên thanh thông báo -> nháy đèn flash + phát giọng đọc
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      blinkFlash(3, 0.15);
      const medNames = action.notification?.extra?.medNames || [];
      voiceAlertService.playAlert(ALERT_TYPES.MED_ALL, medNames);
    });

    listenersRegistered = true;
  } catch (e) {
    console.warn('[medReminders] Không thể cài đặt listeners:', e);
  }
}

export async function syncMedicationReminders() {
  if (!isNative) return { scheduled: 0 };

  const granted = await ensureNotificationPermission();
  if (!granted) return { scheduled: 0, denied: true };

  await setupReminderListeners();

  const { LocalNotifications } = await import('@capacitor/local-notifications');

  // 1. Huỷ các thông báo cũ đã đặt trước đó
  const oldIds = loadIds();
  if (oldIds.length) {
    await LocalNotifications.cancel({ notifications: oldIds.map((id) => ({ id })) }).catch(() => {});
  }

  // 2. Lấy lịch uống thuốc 14 ngày tới từ backend
  let doses = [];
  try {
    const res = await medicationsService.getUpcomingDoses(14);
    doses = res.data.data || [];
  } catch {
    return { scheduled: 0, offline: true };
  }

  const now = Date.now();

  // 3. GỘP CÁC THUỐC CÙNG THỜI ĐIỂM (instant) VÀO 1 NHÓM
  const groupedByTime = {};
  for (const d of doses) {
    const timeMs = new Date(d.instant).getTime();
    if (timeMs <= now + 60000) continue; // Bỏ qua cữ đã qua

    const timeKey = d.instant;
    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = {
        instant: d.instant,
        slot: d.slot,
        timeMs,
        medications: []
      };
    }
    groupedByTime[timeKey].medications.push(d);
  }

  const sortedGroups = Object.values(groupedByTime).sort((a, b) => a.timeMs - b.timeMs);
  const items = [];

  for (const group of sortedGroups) {
    if (items.length >= MAX_SCHEDULED - 2) break;

    const medNames = group.medications.map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`);
    const medShortNames = group.medications.map((m) => m.name);
    
    let bodyText = '';
    if (medNames.length === 1) {
      bodyText = `${medNames[0]} — cữ ${group.slot}`;
    } else {
      bodyText = `${medNames.length} loại thuốc: ${medNames.join(', ')}`;
    }

    // A) THÔNG BÁO CHÍNH (Đúng giờ uống)
    items.push({
      id: timeSlotNotifId(group.instant, false),
      title: `Đến giờ uống thuốc (cữ ${group.slot})`,
      body: bodyText,
      schedule: { at: new Date(group.instant), allowWhileIdle: true },
      sound: 'default',
      smallIcon: 'ic_stat_icon',
      channelId: 'medication_reminders',
      extra: {
        slot: group.slot,
        instant: group.instant,
        medNames: medShortNames,
        isFollowup: false
      },
    });

    // B) THÔNG BÁO NHẮC LẠI SAU 15 PHÚT (Follow-up Snooze)
    const followupTime = new Date(group.timeMs + 15 * 60000);
    items.push({
      id: timeSlotNotifId(group.instant, true),
      title: `Nhắc nhở: Chưa xác nhận cữ ${group.slot}`,
      body: `Đã qua 15 phút. Bạn đừng quên uống: ${medShortNames.join(', ')} nhé!`,
      schedule: { at: followupTime, allowWhileIdle: true },
      sound: 'default',
      smallIcon: 'ic_stat_icon',
      channelId: 'medication_reminders',
      extra: {
        slot: group.slot,
        instant: group.instant,
        medNames: medShortNames,
        isFollowup: true
      },
    });
  }

  if (items.length) {
    await LocalNotifications.schedule({ notifications: items });
  }
  
  saveIds(items.map((i) => i.id));
  return { scheduled: items.length };
}

/** Huỷ toàn bộ nhắc thuốc (khi logout). */
export async function clearMedicationReminders() {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const ids = loadIds();
    if (ids.length) await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    saveIds([]);
  } catch { /* ignore */ }
}
