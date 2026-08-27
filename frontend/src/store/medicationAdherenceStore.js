import { isDoseScheduledForDate, extractMedicationTimes } from '../utils/medicationTime';

const LOGS_STORAGE_KEY = 'diaplus_medication_intake_logs_v1';
const CAREGIVER_STORAGE_KEY = 'diaplus_caregiver_info_v1';

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
export function recordMedicationIntake(medication, status = 'taken', dateObj = new Date()) {
  const dateStr = dateObj.toISOString().slice(0, 10);
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
    status, // 'taken' hoặc 'pending'
    takenAt: status === 'taken' ? nowTime : null,
    timestamp: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    logs[existingIdx] = entry;
  } else {
    logs.push(entry);
  }

  saveIntakeLogs(logs);
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
    const dateStr = d.toISOString().slice(0, 10);

    let dayScheduled = 0;
    let dayTaken = 0;
    const medDetails = [];

    medications.forEach(med => {
      const schedule = isDoseScheduledForDate(med, d);
      if (schedule.isScheduled) {
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
          label: schedule.label
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
