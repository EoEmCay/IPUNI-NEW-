import { create } from 'zustand';
import {
  isDoseScheduledForDate,
  hasCountableDoseOn,
  extractMedicationTimes,
  getMedicationSlotObjects,
  classifySlotPeriod,
  timeStringToMinutes,
} from '../utils/medicationTime';
import { medicationsService } from '../services/medications.service';
import { buildTodayInstant } from '../lib/medReminders';
import { localYmd } from '../utils/date';
import useMedicationsStore from './medicationsStore';

const LOGS_STORAGE_KEY = 'diaplus_medication_intake_logs_v2';
const CAREGIVER_STORAGE_KEY = 'diaplus_caregiver_info_v1';

const keyFor = (medId, slot, ymd) => `${medId}|${slot || ''}|${ymd}`;

// Làm tròn tỷ lệ % đến 1 chữ số thập phân (ví dụ 41.7%, 58.3%, 85.7%) để không tính quá tròn
export function calcDecimalPercent(taken, scheduled) {
  if (!scheduled || scheduled <= 0) return 100;
  const raw = (taken / scheduled) * 100;
  return Math.round(raw * 10) / 10;
}

export const useMedicationAdherenceStore = create((set, get) => ({
  doseStatus: {}, // { key -> 'taken' | 'skipped' }
  summary: null, // kết quả /medications/adherence
  loading: false,

  keyFor,

  async hydrateFromLogs(days = 2) {
    try {
      const res = await medicationsService.getLogs(days);
      const map = {};
      for (const l of res.data.data || []) {
        const ymd = localYmd(l.scheduled_for);
        map[keyFor(l.medication_id, l.slot_time, ymd)] = l.status;
      }
      set({ doseStatus: map });
    } catch {
      /* im lặng */
    }
  },

  async logDose(medId, { slot, scheduledFor, status = 'taken' } = {}) {
    const ymd = localYmd(scheduledFor || new Date());
    const k = keyFor(medId, slot, ymd);
    const prev = get().doseStatus[k];
    set((s) => ({ doseStatus: { ...s.doseStatus, [k]: status } })); // optimistic
    try {
      await medicationsService.logDose(medId, { slot, scheduledFor, status });
      get().fetchSummary();
    } catch {
      set((s) => {
        const n = { ...s.doseStatus };
        if (prev) n[k] = prev;
        else delete n[k];
        return { doseStatus: n };
      });
    }
  },

  async fetchSummary(days = 30) {
    set({ loading: true });
    try {
      const res = await medicationsService.getAdherence(days);
      set({ summary: res.data.data });
    } finally {
      set({ loading: false });
    }
  },
}));

// Lấy toàn bộ nhật ký uống thuốc từ localStorage
export function getIntakeLogs() {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Lưu nhật ký uống thuốc
export function saveIntakeLogs(logs) {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Không thể lưu intake logs:', err);
  }
}

// Kiểm tra tiến độ uống theo từng cử trong ngày của 1 loại thuốc
export function getMedicationDayProgress(medication, dateObj = new Date(), logsOverride = null) {
  const dateStr = localYmd(dateObj);
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
  const logs = logsOverride || getIntakeLogs();
  const slots = getMedicationSlotObjects(medication);

  const slotDetails = slots.map((slot) => {
    const log =
      logs.find(
        (l) =>
          l.date === dateStr &&
          String(l.medicationId) === String(medication?.id) &&
          (l.slotKey === slot.key || l.slotTime === slot.time)
      ) ||
      logs.find(
        (l) =>
          l.date === dateStr &&
          String(l.medicationId) === String(medication?.id) &&
          l.slotPeriod === slot.period &&
          slots.filter((s) => s.period === slot.period).length === 1
      );
    const status = log ? log.status : 'pending';
    const slotMinutes = timeStringToMinutes(slot.time);
    const isArrived = slotMinutes === null ? true : currentMinutes >= slotMinutes;
    const isLate = status === 'pending' && slotMinutes !== null && currentMinutes - slotMinutes >= 60;

    return {
      ...slot,
      status,
      takenAt: log?.takenAt || null,
      minutes: slotMinutes,
      isArrived,
      isLate,
    };
  });

  const totalSlots = slotDetails.length;
  const takenSlots = slotDetails.filter((s) => s.status === 'taken').length;
  const skippedSlots = slotDetails.filter((s) => s.status === 'skipped').length;
  const completedSlots = takenSlots + skippedSlots;
  const isAllTaken = totalSlots > 0 && takenSlots >= totalSlots;
  const isAllDone = totalSlots > 0 && completedSlots >= totalSlots;
  const isPartial = completedSlots > 0 && completedSlots < totalSlots;
  const nextPendingSlot = slotDetails.find((s) => s.status === 'pending') || null;
  const lastCompletedSlot = [...slotDetails].reverse().find((s) => s.status === 'taken' || s.status === 'skipped') || null;
  const takenLabels = slotDetails
    .filter((s) => s.status === 'taken')
    .map((s) => `${s.periodLabel} (${s.time})`);
  const overallStatus = isAllTaken
    ? 'taken'
    : isAllDone && skippedSlots >= totalSlots
    ? 'skipped'
    : isPartial
    ? 'partial'
    : 'pending';

  return {
    slots: slotDetails,
    totalSlots,
    takenSlots,
    takenCount: takenSlots,
    skippedSlots,
    completedSlots,
    takenLabels,
    status: overallStatus,
    isAllTaken,
    isAllDone,
    isPartial,
    nextPendingSlot,
    lastCompletedSlot,
    isNextSlotArrived: Boolean(nextPendingSlot && nextPendingSlot.isArrived),
    isNextSlotLate: Boolean(nextPendingSlot && nextPendingSlot.isLate),
  };
}

// Ghi nhận 1 cử uống thuốc (theo đúng cử Sáng / Chiều / Tối, không đánh dấu gộp cả ngày nếu thuốc có 2 cử)
export function recordMedicationIntake(
  medication,
  status = 'taken',
  dateObj = new Date(),
  reason = null,
  slotTime = null
) {
  if (!medication || medication.id == null) return null;

  const dateStr = localYmd(dateObj);
  const nowTime = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const logs = getIntakeLogs();
  const slots = getMedicationSlotObjects(medication);

  let targetSlot = null;
  if (slotTime) {
    const requestedPeriod = classifySlotPeriod(slotTime);
    targetSlot =
      slots.find((s) => s.key === slotTime) ||
      slots.find((s) => s.time === slotTime) ||
      slots.find((s) => s.period === requestedPeriod) ||
      (slots.length === 1 ? slots[0] : null);

    // Nếu thuốc này hoàn toàn không có lịch uống trong cử đang bấm (ví dụ thuốc chỉ uống Chiều nhưng đang xác nhận Cử Sáng)
    if (!targetSlot) {
      return null;
    }
  } else {
    const progress = getMedicationDayProgress(medication, dateObj, logs);
    if (status === 'pending') {
      // Nếu người dùng bấm hoàn tác, hoàn tác cử vừa đánh dấu gần nhất
      const lastMarked = [...progress.slots].reverse().find((s) => s.status === 'taken' || s.status === 'skipped');
      targetSlot = lastMarked || slots[0];
    } else {
      targetSlot = progress.nextPendingSlot || slots[0];
    }
  }

  const slotKey = targetSlot?.key || 'morning';
  const slotPeriod = targetSlot?.period || 'morning';
  const resolvedSlotTime = targetSlot?.time || slotTime || '07:00';

  const existingIdx = logs.findIndex(
    (l) =>
      l.date === dateStr &&
      String(l.medicationId) === String(medication.id) &&
      (l.slotKey === slotKey || l.slotTime === resolvedSlotTime)
  );

  const entry = {
    id: `${dateStr}_${medication.id}_${slotKey}`,
    date: dateStr,
    medicationId: medication.id,
    medicationName: medication.name,
    dosage: medication.dosage,
    slotKey,
    slotPeriod,
    slotTime: resolvedSlotTime,
    status, // 'taken' | 'pending' | 'skipped'
    reason: status === 'skipped' ? reason || null : null,
    takenAt: status === 'taken' ? nowTime : null,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    logs[existingIdx] = entry;
  } else {
    logs.push(entry);
  }

  saveIntakeLogs(logs);

  // Tính lại trạng thái tổng của thuốc trong ngày hôm nay để cập nhật store
  const updatedProgress = getMedicationDayProgress(medication, dateObj, logs);
  const overallStatus = updatedProgress.isAllTaken
    ? 'taken'
    : updatedProgress.isPartial
    ? 'partial'
    : updatedProgress.skippedSlots >= updatedProgress.totalSlots
    ? 'skipped'
    : 'pending';

  try {
    useMedicationsStore.getState().setMedicationStatus(medication.id, overallStatus, slotKey);
  } catch {
    /* ignore */
  }

  try {
    if ((status === 'taken' || status === 'skipped') && typeof medication.id === 'number') {
      const scheduledFor = resolvedSlotTime ? buildTodayInstant(resolvedSlotTime, dateObj) : null;
      medicationsService
        .logDose(medication.id, {
          slot: resolvedSlotTime,
          status,
          takenAt: new Date().toISOString(),
          ...(scheduledFor ? { scheduledFor } : {}),
          ...(status === 'skipped' && reason ? { reason } : {}),
        })
        .catch(() => {});
    }
  } catch {
    /* offline */
  }

  return entry;
}

// Chọn đúng cử thuốc tiếp theo chưa uống trong ngày để mở Chuông nhắc thuốc theo đúng cử (không gom 2 cử làm 1)
export function getNextAlarmPayloadForToday(medications = [], now = new Date()) {
  const validMeds = (medications || []).filter(
    (m) => isDoseScheduledForDate(m, now).isScheduled
  );
  if (validMeds.length === 0) {
    return { meds: [], slotTime: '07:00' };
  }

  const logs = getIntakeLogs();
  const periodOrder = ['morning', 'afternoon', 'evening'];
  const periodBuckets = {
    morning: { time: '07:00', meds: [], pendingCount: 0 },
    afternoon: { time: '16:00', meds: [], pendingCount: 0 },
    evening: { time: '18:30', meds: [], pendingCount: 0 },
  };

  validMeds.forEach((med) => {
    const progress = getMedicationDayProgress(med, now, logs);
    progress.slots.forEach((slot) => {
      const bucket = periodBuckets[slot.period];
      if (!bucket) return;
      bucket.time = slot.time || bucket.time;
      bucket.meds.push(med);
      if (slot.status !== 'taken') {
        bucket.pendingCount += 1;
      }
    });
  });

  // Ưu tiên cử đầu tiên trong ngày còn thuốc chưa uống (ví dụ Cử sáng -> uống xong Cử sáng mới tới Cử chiều)
  const firstPendingPeriod = periodOrder.find(
    (p) => periodBuckets[p].meds.length > 0 && periodBuckets[p].pendingCount > 0
  );
  const chosenPeriod =
    firstPendingPeriod ||
    periodOrder.find((p) => periodBuckets[p].meds.length > 0) ||
    'morning';

  const chosen = periodBuckets[chosenPeriod];
  return {
    meds: chosen.meds,
    slotTime: chosen.time,
    period: chosenPeriod,
  };
}

// Lấy thông tin Người nhà nhắc nhở
export function getCaregiverInfo() {
  try {
    const raw = localStorage.getItem(CAREGIVER_STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          name: '',
          phone: '',
          relationship: 'Con/Người thân',
          email: '',
        };
  } catch {
    return { name: '', phone: '', relationship: 'Con/Người thân', email: '' };
  }
}

// Lưu thông tin Người nhà nhắc nhở
export function saveCaregiverInfo(info) {
  try {
    localStorage.setItem(CAREGIVER_STORAGE_KEY, JSON.stringify(info));
  } catch (err) {
    console.error('Không thể lưu caregiver info:', err);
  }
}

/**
 * Tính toán thống kê điểm tuân thủ (Adherence Score) theo đúng từng cử uống trong ngày
 * và trả về tỷ lệ % lẻ chính xác (ví dụ 41.7%, 58.3%, 85.7%)
 */
export function calculateAdherenceStats(medications = [], days = 7) {
  if (!medications || medications.length === 0) {
    return {
      score: 100,
      streakDays: 0,
      totalScheduled: 0,
      totalTaken: 0,
      rating: { label: 'Chưa có đơn thuốc', color: '#6B7280', badge: 'ℹ️ Hãy thêm đơn thuốc' },
      history: [],
    };
  }

  const logs = getIntakeLogs();
  const history = [];
  let totalScheduled = 0;
  let totalTaken = 0;
  let currentStreak = 0;
  let streakBroken = false;

  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = localYmd(d);

    let dayScheduled = 0;
    let dayTaken = 0;
    const medDetails = [];

    medications.forEach((med) => {
      const schedule = isDoseScheduledForDate(med, d);
      if (schedule.isScheduled && hasCountableDoseOn(med, d)) {
        const progress = getMedicationDayProgress(med, d, logs);
        dayScheduled += progress.totalSlots;
        dayTaken += progress.takenSlots;

        const takenSlotLabels = progress.slots
          .filter((s) => s.status === 'taken')
          .map((s) => `${s.shortLabel}${s.takenAt ? ` ${s.takenAt}` : ''}`);
        const pendingSlotLabels = progress.slots
          .filter((s) => s.status !== 'taken')
          .map((s) => `${s.shortLabel} ${s.time}`);

        medDetails.push({
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          times: extractMedicationTimes(med),
          totalSlots: progress.totalSlots,
          takenSlots: progress.takenSlots,
          slots: progress.slots,
          status: progress.isAllTaken
            ? 'taken'
            : progress.isPartial
            ? 'partial'
            : 'pending',
          takenAt:
            progress.slots
              .filter((s) => s.status === 'taken' && s.takenAt)
              .map((s) => s.takenAt)
              .pop() || null,
          takenSummary:
            progress.isAllTaken
              ? progress.totalSlots > 1
                ? `Đã uống đủ ${progress.takenSlots}/${progress.totalSlots} cử`
                : `Đã uống ${takenSlotLabels[0] || ''}`.trim()
              : progress.isPartial
              ? `Đã uống ${progress.takenSlots}/${progress.totalSlots} cử (${takenSlotLabels.join(', ')})`
              : `Chưa uống (${pendingSlotLabels.join(', ')})`,
        });
      } else {
        medDetails.push({
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          totalSlots: 0,
          takenSlots: 0,
          status: 'rest_day',
          label: schedule.isScheduled ? 'Chưa có thuốc' : schedule.label,
        });
      }
    });

    const dayScore = dayScheduled > 0 ? calcDecimalPercent(dayTaken, dayScheduled) : 100;

    // Tính streak: tính từ hôm qua trở về trước
    if (i > 0) {
      if (!streakBroken && dayScore >= 70) {
        currentStreak += 1;
      } else {
        streakBroken = true;
      }
    }

    totalScheduled += dayScheduled;
    totalTaken += dayTaken;

    history.push({
      date: dateStr,
      dateLabel: d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      }),
      scheduled: dayScheduled,
      taken: dayTaken,
      score: dayScore,
      medications: medDetails,
    });
  }

  const overallScore =
    totalScheduled > 0 ? calcDecimalPercent(totalTaken, totalScheduled) : 100;

  let rating;
  if (overallScore >= 90) {
    rating = { label: 'Xuất sắc', color: '#16A34A', badge: '🌟 Bệnh nhân gương mẫu' };
  } else if (overallScore >= 75) {
    rating = { label: 'Khá tốt', color: '#2563EB', badge: '👍 Duy trì đều đặn' };
  } else if (overallScore > 0) {
    rating = { label: 'Đang uống theo cử', color: '#0EA5E9', badge: '⏳ Còn cử chưa uống' };
  } else {
    rating = { label: 'Cần chú ý', color: '#DC2626', badge: '🚨 Nguy cơ quên cử' };
  }

  return {
    score: overallScore,
    streakDays: currentStreak,
    totalScheduled,
    totalTaken,
    rating,
    history,
  };
}

export default useMedicationAdherenceStore;
