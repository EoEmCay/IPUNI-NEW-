import { create } from 'zustand';
import { isDoseScheduledForDate, hasCountableDoseOn, extractMedicationTimes } from '../utils/medicationTime';
import { medicationsService } from '../services/medications.service';
import { buildTodayInstant } from '../lib/medReminders';
import { localYmd } from '../utils/date';

const LOGS_STORAGE_KEY = 'diaplus_medication_intake_logs_v1';
const CAREGIVER_STORAGE_KEY = 'diaplus_caregiver_info_v1';

const keyFor = (medId, slot, ymd) => `${medId}|${slot || ''}|${ymd}`;

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
    } catch { /* im lặng */ }
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
        if (prev) n[k] = prev; else delete n[k];
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

// Ghi nhận một cữ uống thuốc
// slotTime: cữ đang xác nhận ("07:00") - gửi kèm để server ghi đúng cữ, không phải đoán cữ gần nhất.
export function recordMedicationIntake(medication, status = 'taken', dateObj = new Date(), reason = null, slotTime = null) {
  const dateStr = localYmd(dateObj);
  const nowTime = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const logs = getIntakeLogs();

  const existingIdx = logs.findIndex(
    l => l.date === dateStr && l.medicationId === medication.id
  );

  const entry = {
    id: `${dateStr}_${medication.id}`,
    date: dateStr,
    medicationId: medication.id,
    medicationName: medication.name,
    dosage: medication.dosage,
    status, // 'taken' | 'pending' | 'skipped'
    reason: status === 'skipped' ? (reason || null) : null,
    takenAt: status === 'taken' ? nowTime : null,
    timestamp: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    logs[existingIdx] = entry;
  } else {
    logs.push(entry);
  }

  saveIntakeLogs(logs);

  // Đồng bộ lên backend DB nếu có thể. Chỉ gửi "đã uống"/"bỏ qua": bấm bỏ đánh dấu (pending)
  // trước đây bị gửi thành "skipped" -> người nhà sẽ nhận cảnh báo "Bỏ qua cữ" oan.
  // ponytail: bỏ đánh dấu chưa xoá log "taken" trên server; cần endpoint xoá log nếu muốn khớp tuyệt đối.
  try {
    if ((status === 'taken' || status === 'skipped') && medication && typeof medication.id === 'number') {
      const scheduledFor = slotTime ? buildTodayInstant(slotTime, dateObj) : null;
      medicationsService.logDose(medication.id, {
        status,
        takenAt: new Date().toISOString(),
        ...(scheduledFor ? { scheduledFor } : {}),
        ...(status === 'skipped' && reason ? { reason } : {}),
      }).catch(() => {});
    }
  } catch { /* offline: log vẫn còn ở máy */ }

  return entry;
}

// Lấy thông tin Người nhà nhắc nhở
export function getCaregiverInfo() {
  try {
    const raw = localStorage.getItem(CAREGIVER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {
      name: '',
      phone: '',
      relationship: 'Con/Người thân',
      email: ''
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
 * Tính toán thống kê điểm tuân thủ (Adherence Score) và chuỗi ngày Streak
 * @param {Array} medications Danh sách thuốc
 * @param {number} days Số ngày thống kê (ví dụ 7 ngày qua)
 */
export function calculateAdherenceStats(medications = [], days = 7) {
  if (!medications || medications.length === 0) {
    return {
      score: 100,
      streakDays: 0,
      totalScheduled: 0,
      totalTaken: 0,
      rating: { label: 'Chưa có đơn thuốc', color: '#6B7280', badge: 'ℹ️ Hãy thêm đơn thuốc' },
      history: []
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

    medications.forEach(med => {
      const schedule = isDoseScheduledForDate(med, d);
      // Không tính ngày/cữ trước lúc thêm thuốc
      if (schedule.isScheduled && hasCountableDoseOn(med, d)) {
        dayScheduled += 1;

        // Tìm log của thuốc trong ngày
        const log = logs.find(l => l.date === dateStr && l.medicationId === med.id);
        const isTaken = log ? log.status === 'taken' : false;

        if (isTaken) {
          dayTaken += 1;
        }

        medDetails.push({
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          times: extractMedicationTimes(med),
          status: isTaken ? 'taken' : 'pending',
          takenAt: log?.takenAt || null
        });
      } else {
        medDetails.push({
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          status: 'rest_day',
          label: schedule.isScheduled ? 'Chưa có thuốc' : schedule.label
        });
      }
    });

    const dayScore = dayScheduled > 0 ? Math.round((dayTaken / dayScheduled) * 100) : 100;

    // Tính streak: tính từ hôm qua trở về trước
    if (i > 0) {
      if (!streakBroken && dayScore >= 70) {
        currentStreak += 1;
      } else if (i > 0) {
        streakBroken = true;
      }
    }

    totalScheduled += dayScheduled;
    totalTaken += dayTaken;

    history.push({
      date: dateStr,
      dateLabel: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      scheduled: dayScheduled,
      taken: dayTaken,
      score: dayScore,
      medications: medDetails
    });
  }

  const overallScore = totalScheduled > 0 
    ? Math.round((totalTaken / totalScheduled) * 100) 
    : 100;

  let rating;
  if (overallScore >= 90) {
    rating = { label: 'Xuất sắc', color: '#16A34A', badge: '🌟 Bệnh nhân gương mẫu' };
  } else if (overallScore >= 75) {
    rating = { label: 'Khá tốt', color: '#2563EB', badge: '👍 Cần duy trì đều đặn' };
  } else {
    rating = { label: 'Cần chú ý', color: '#DC2626', badge: '🚨 Nguy cơ quên cữ' };
  }

  return {
    score: overallScore,
    streakDays: currentStreak,
    totalScheduled,
    totalTaken,
    rating,
    history
  };
}

export default useMedicationAdherenceStore;
