/**
 * Lên lịch nhắc uống thuốc bằng Local Notification (Capacitor) — chạy CẢ KHI app đóng.
 *
 * Tính năng nâng cao:
 * 1. GỘP CÁC THUỐC CÙNG GIỜ VÀO 1 THÔNG BÁO DUY NHẤT (tránh spam nhiều thông báo cùng lúc).
 * 2. TỰ ĐỘNG NHẮC LẠI SAU 15 PHÚT (Follow-up Snooze) nếu chưa xác nhận.
 * 3. BẬT ÂM THANH CHUÔNG HỆ THỐNG & RUNG (Sound: default, High priority).
 * 4. TÍCH HỢP GIỌNG ĐỌC "CHỊ GOOGLE" (Google TTS tiếng Việt) khi mở/chạm thông báo.
 */
import { isNative } from './native';
import { notifyWithEffects } from './notify';
import { medicationsService } from '../services/medications.service';
import { ALERT_TYPES } from '../services/voiceAlert.service';
import {
  MAX_SCHEDULED,
  VN_OFFSET_MIN,
  timeSlotNotifId,
  buildTodayInstant,
  groupDosesForNotification,
} from '../utils/reminderCalc';

export {
  MAX_SCHEDULED,
  VN_OFFSET_MIN,
  timeSlotNotifId,
  buildTodayInstant,
  groupDosesForNotification,
};

const STORE_KEY = 'diaplus_reminder_ids';

let listenersRegistered = false;

function loadIds() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
function saveIds(ids) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
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
      notifyWithEffects(ALERT_TYPES.MED_ALL, { meds: notification.extra?.medNames || [] });
    });

    // Khi người dùng bấm vào thông báo trên thanh thông báo -> nháy đèn flash + phát giọng đọc
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      notifyWithEffects(ALERT_TYPES.MED_ALL, { meds: action.notification?.extra?.medNames || [] });
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

  // 3. Gom nhóm cữ thuốc theo thời điểm chính xác
  const items = groupDosesForNotification(doses, Date.now());

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
