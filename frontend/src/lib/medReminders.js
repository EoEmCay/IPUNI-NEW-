/**
 * Lên lịch nhắc uống thuốc bằng Local Notification (Capacitor) — chạy CẢ KHI app đóng.
 * Trên web: no-op (VoiceAlertEngine lo phần nhắc khi app đang mở).
 *
 * Chiến lược: lấy các liều sắp tới 14 ngày từ backend (dùng chung engine lịch thuốc TZ-safe),
 * huỷ toàn bộ thông báo cũ của DIA+ rồi đặt lại. Gọi mỗi khi mở app / đổi thuốc.
 */
import { isNative } from './native';
import { medicationsService } from '../services/medications.service';

const STORE_KEY = 'diaplus_reminder_ids';
const MAX_SCHEDULED = 60; // iOS giới hạn 64 local notification chờ

function loadIds() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
function saveIds(ids) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

/** id ổn định trong khoảng int32 dương từ (medId, thời điểm). */
function doseNotifId(medicationId, instantIso) {
  const t = Math.floor(new Date(instantIso).getTime() / 60000); // phút epoch
  return ((Number(medicationId) % 1000) * 4000000 + (t % 4000000)) | 0 || 1;
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

export async function syncMedicationReminders() {
  if (!isNative) return { scheduled: 0 };

  const granted = await ensureNotificationPermission();
  if (!granted) return { scheduled: 0, denied: true };

  const { LocalNotifications } = await import('@capacitor/local-notifications');

  // Huỷ thông báo DIA+ đã đặt trước đó
  const oldIds = loadIds();
  if (oldIds.length) {
    await LocalNotifications.cancel({ notifications: oldIds.map((id) => ({ id })) }).catch(() => {});
  }

  let doses = [];
  try {
    const res = await medicationsService.getUpcomingDoses(14);
    doses = res.data.data || [];
  } catch {
    return { scheduled: 0, offline: true };
  }

  const now = Date.now();
  const items = doses
    .filter((d) => new Date(d.instant).getTime() > now + 60000)
    .slice(0, MAX_SCHEDULED)
    .map((d) => ({
      id: doseNotifId(d.medicationId, d.instant),
      title: '💊 Đến giờ uống thuốc',
      body: `${d.name}${d.dosage ? ' ' + d.dosage : ''} — cữ ${d.slot}`,
      schedule: { at: new Date(d.instant), allowWhileIdle: true },
      sound: 'default',
      smallIcon: 'ic_stat_icon',
      extra: { medicationId: d.medicationId, slot: d.slot },
    }));

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
