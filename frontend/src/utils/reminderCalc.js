/**
 * Các thuật toán tính toán và gom nhóm nhắc uống thuốc (Local Notifications).
 * Thuần túy toán & logic thời gian (Pure functions), không phụ thuộc vào Capacitor hay DOM,
 * giúp kiểm thử độc lập 100% trên Node.js.
 */

export const MAX_SCHEDULED = 60; // Giới hạn iOS (tối đa 64 local notifications chờ)
export const VN_OFFSET_MIN = 420; // UTC+7 cố định (không DST)

/** Tạo id thông báo duy nhất trong khoảng int32 dương từ mốc thời gian */
export function timeSlotNotifId(instantIso, isFollowup = false) {
  const epochMins = Math.floor(new Date(instantIso).getTime() / 60000);
  const base = Math.abs(epochMins % 100000000);
  return isFollowup ? (base + 100000000) : base;
}

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
  const shifted = new Date(dateObj.getTime() + VN_OFFSET_MIN * 60000);
  const y = shifted.getUTCFullYear();
  const mo = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  return new Date(Date.UTC(y, mo, d, hh, mm, 0) - VN_OFFSET_MIN * 60000).toISOString();
}

/**
 * Thuật toán gom nhóm các cữ thuốc cùng thời điểm (instant) và tạo danh sách thông báo.
 * Hỗ trợ cả 2 chuẩn trường `scheduledFor` (Backend) lẫn `instant` (Fallback).
 */
export function groupDosesForNotification(doses = [], nowMs = Date.now()) {
  const groupedByTime = {};

  for (const d of doses) {
    const rawInstant = d.scheduledFor || d.instant;
    if (!rawInstant) continue;

    const timeMs = new Date(rawInstant).getTime();
    if (Number.isNaN(timeMs) || timeMs <= nowMs + 60000) continue; // Bỏ qua cữ đã qua hoặc sai ngày

    const slotLabel = d.slotTime || d.slot || 'uống thuốc';
    const timeKey = rawInstant;

    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = {
        instant: rawInstant,
        slot: slotLabel,
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

  return items;
}
