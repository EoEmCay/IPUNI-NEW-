export const MEAL_TIME_PRESETS = [
  { key: 'morning', label: 'Sáng', time: '07:00' },
  { key: 'noon', label: 'Trưa', time: '11:30' },
  { key: 'afternoon', label: 'Chiều', time: '15:30' },
  { key: 'evening', label: 'Tối', time: '18:30' },
  { key: 'bedtime', label: 'Trước ngủ', time: '21:30' },
];

/**
 * Kiểm tra đơn thuốc có chỉ định uống cách ngày hay không
 */
export function isAlternateDayDose(medication) {
  if (!medication) return false;
  const text = `${medication.frequency || ''} ${medication.instructions || ''} ${medication.dosage || ''}`.toLowerCase();
  return (
    text.includes('cách ngày') ||
    text.includes('mỗi 2 ngày') ||
    text.includes('2 ngày 1 lần') ||
    text.includes('alternate') ||
    text.includes('2-4-6') ||
    text.includes('3-5-7') ||
    medication.is_alternate_day === true
  );
}

/**
 * Kiểm tra xem ngày cụ thể có phải là ngày uống thuốc hay ngày nghỉ cữ
 * @returns { isScheduled: boolean, isRestDay: boolean, label: string }
 */
export function isDoseScheduledForDate(medication, dateObj = new Date()) {
  if (!medication) return { isScheduled: true, isRestDay: false, label: '' };

  const text = `${medication.frequency || ''} ${medication.instructions || ''}`.toLowerCase();

  // Kiểm tra lịch cố định Thứ 2, 4, 6 (Mon=1, Wed=3, Fri=5)
  if (text.includes('2-4-6') || text.includes('thứ 2, 4, 6') || text.includes('thứ 2,4,6')) {
    const day = dateObj.getDay();
    const isMonWedFri = day === 1 || day === 3 || day === 5;
    return {
      isScheduled: isMonWedFri,
      isRestDay: !isMonWedFri,
      label: isMonWedFri ? 'Lịch Thứ 2, 4, 6' : 'Nghỉ cữ (Hôm nay không phải T2, T4, T6)'
    };
  }

  // Kiểm tra lịch cố định Thứ 3, 5, 7 (Tue=2, Thu=4, Sat=6)
  if (text.includes('3-5-7') || text.includes('thứ 3, 5, 7') || text.includes('thứ 3,5,7')) {
    const day = dateObj.getDay();
    const isTueThuSat = day === 2 || day === 4 || day === 6;
    return {
      isScheduled: isTueThuSat,
      isRestDay: !isTueThuSat,
      label: isTueThuSat ? 'Lịch Thứ 3, 5, 7' : 'Nghỉ cữ (Hôm nay không phải T3, T5, T7)'
    };
  }

  // Kiểm tra cách ngày (1 ngày uống, 1 ngày nghỉ)
  if (isAlternateDayDose(medication)) {
    const startDate = medication.prescribed_at || medication.created_at || '2026-01-01';
    const startMs = new Date(startDate).setHours(0, 0, 0, 0);
    const targetMs = new Date(dateObj).setHours(0, 0, 0, 0);
    const daysDiff = Math.round(Math.abs(targetMs - startMs) / (1000 * 60 * 60 * 24));
    const isTakeDay = daysDiff % 2 === 0;

    return {
      isScheduled: isTakeDay,
      isRestDay: !isTakeDay,
      label: isTakeDay ? 'Cách ngày • Hôm nay có lịch uống' : 'Cách ngày • Hôm nay nghỉ cữ'
    };
  }

  // Mặc định uống hàng ngày
  return {
    isScheduled: true,
    isRestDay: false,
    label: 'Hàng ngày'
  };
}

/**
 * Kiểm tra xem đơn thuốc có ghi giờ cụ thể không hay chỉ ghi chung chung Sáng/Trưa/Chiều
 */
export function hasGenericMealTimes(medication) {
  if (!medication) return true;
  const rawTimes = medication.times;
  // Nếu có mảng times nhưng được map từ từ khóa Sáng/Trưa/Chiều
  const text = `${medication.frequency || ''} ${medication.timing || ''} ${medication.instructions || ''}`.toLowerCase();
  const hasSpecificTime = /\b\d{1,2}[:h]\d{2}\b/.test(text);
  return !hasSpecificTime;
}

export function classifySlotPeriod(timeStr) {
  if (timeStr === 'morning' || timeStr === 'afternoon' || timeStr === 'evening') {
    return timeStr;
  }
  const mins = timeStringToMinutes(timeStr);
  if (mins === null) return 'morning';
  if (mins <= 720) return 'morning';                  // 00:00 - 12:00
  if (mins > 720 && mins <= 1050) return 'afternoon'; // 12:01 - 17:30
  return 'evening';
}

export function getPeriodShortLabel(periodKey) {
  if (periodKey === 'morning') return 'Sáng';
  if (periodKey === 'afternoon') return 'Chiều';
  return 'Tối';
}

export function getPeriodFullLabel(periodKey) {
  if (periodKey === 'morning') return 'Cử sáng';
  if (periodKey === 'afternoon') return 'Cử chiều';
  return 'Cử tối';
}

/**
 * Trích xuất danh sách giờ uống dạng HH:mm từ thuốc (hỗ trợ mảng, chuỗi JSON, chuỗi phân tách hoặc từ khóa buổi)
 */
export function extractMedicationTimes(medication) {
  if (!medication) return [];
  const result = [];

  let raw = medication.times;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) raw = parsed;
      } catch {}
    }
  }

  if (Array.isArray(raw)) {
    raw.forEach(t => {
      if (typeof t === 'string' && t.trim()) {
        result.push(t.trim());
      }
    });
  } else if (typeof raw === 'string' && raw.trim()) {
    const parts = raw.split(/[&,;]/).map(s => s.trim()).filter(Boolean);
    result.push(...parts);
  }

  const text = `${medication.frequency || ''} ${medication.timing || ''} ${medication.instructions || ''}`.toLowerCase();

  // Nếu không có times rõ ràng, quét trong frequency, timing, instructions
  if (result.length === 0) {
    // Tìm mẫu giờ như: 08:00, 8:00, 8h30, 20h00
    const timeMatches = text.match(/\b\d{1,2}[:h]\d{2}\b/g);
    if (timeMatches && timeMatches.length > 0) {
      timeMatches.forEach(tm => {
        const norm = tm.replace('h', ':');
        const [h, m] = norm.split(':');
        result.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      });
    } else {
      // Map từ khóa buổi nếu có
      if (text.includes('sáng')) result.push('07:00');
      if (text.includes('trưa')) result.push('12:30');
      if (text.includes('chiều')) result.push('16:00');
      if (text.includes('tối')) result.push('18:30');
      if (text.includes('ngủ') || text.includes('đêm')) result.push('20:30');
    }
  } else {
    // Đảm bảo nếu lời dặn bác sĩ ghi rõ cả Sáng và Chiều (2 cử) mà mảng times cũ chỉ lưu 1 giờ thì bổ sung đủ cử
    const normalizedExisting = result
      .map(t => {
        const clean = t.replace(/[^0-9:]/g, '');
        const [h, m] = clean.split(':');
        return h != null && m != null ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : t;
      })
      .filter(t => /^\d{2}:\d{2}$/.test(t));

    const existingPeriods = new Set(normalizedExisting.map(classifySlotPeriod));
    if (text.includes('sáng') && !existingPeriods.has('morning')) {
      result.push('07:00');
    }
    if ((text.includes('chiều') || text.includes('trưa')) && !existingPeriods.has('afternoon')) {
      result.push('16:00');
    }
    if (text.includes('tối') && !existingPeriods.has('evening')) {
      result.push('18:30');
    }
  }

  // Chuẩn hóa dạng HH:mm và sắp xếp theo thứ tự thời gian trong ngày
  const normalized = result
    .map(t => {
      const clean = t.replace(/[^0-9:]/g, '');
      const [h, m] = clean.split(':');
      if (h != null && m != null) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      return t;
    })
    .filter(t => /^\d{2}:\d{2}$/.test(t));

  const unique = Array.from(new Set(normalized));
  unique.sort((a, b) => (timeStringToMinutes(a) || 0) - (timeStringToMinutes(b) || 0));
  return unique;
}

/**
 * Trả về danh sách các cử uống trong ngày của 1 loại thuốc (mỗi cử gồm time, period, periodLabel)
 */
export function getMedicationSlotObjects(medication) {
  const times = extractMedicationTimes(medication);
  const rawSlots = times.length > 0 ? times : ['07:00'];
  const seenPeriods = new Set();
  const slots = [];

  rawSlots.forEach((timeStr) => {
    const period = classifySlotPeriod(timeStr);
    // Gộp theo cử Sáng / Chiều / Tối để mỗi cử trong đơn bác sĩ là 1 lần uống độc lập
    const key = seenPeriods.has(period) ? `${period}_${timeStr}` : period;
    seenPeriods.add(period);
    slots.push({
      key,
      period,
      time: timeStr,
      shortLabel: getPeriodShortLabel(period),
      periodLabel: getPeriodFullLabel(period),
    });
  });

  return slots;
}

/**
 * Đổi chuỗi 'HH:mm' thành tổng số phút trong ngày
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return null;
}

/**
 * Kiểm tra xem cữ thuốc đã tới giờ uống chưa
 * @returns {
 *   isTimeArrived: boolean,       // Đã tới giờ uống ít nhất 1 cữ chưa
 *   earliestUpcomingTime: string, // Cữ uống tiếp theo chưa tới giờ
 *   isLate: boolean,              // Có cữ nào đã qua quá 60 phút mà chưa uống
 *   times: string[]               // Danh sách tất cả các cữ
 * }
 */
// created_at từ API: ISO có múi giờ (Postgres) hoặc "YYYY-MM-DD HH:MM:SS" theo giờ UTC (SQLite).
export function parseServerTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  const d = new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s : `${s.replace(' ', 'T')}Z`);
  return isNaN(d.getTime()) ? null : d;
}

// Thuốc chỉ bắt đầu có cữ từ LÚC ĐƯỢC THÊM: cữ có giờ sớm hơn lúc thêm thì không tính
// (không trễ, không quên, không báo người nhà). Trả về phút-trong-ngày của mốc bắt đầu cho
// ngày dateObj: null = cả ngày đều tính; Infinity = ngày này thuốc chưa tồn tại.
export function firstDoseMinuteOn(medication, dateObj = new Date()) {
  const created = parseServerTime(medication?.created_at);
  if (!created) return null;
  const day = new Date(dateObj); day.setHours(0, 0, 0, 0);
  const createdDay = new Date(created); createdDay.setHours(0, 0, 0, 0);
  if (createdDay < day) return null;
  if (createdDay > day) return Infinity;
  return created.getHours() * 60 + created.getMinutes();
}

// Ngày dateObj có ít nhất 1 cữ tính được (đúng lịch và không trước lúc thêm thuốc)
export function hasCountableDoseOn(medication, dateObj = new Date()) {
  if (!isDoseScheduledForDate(medication, dateObj).isScheduled) return false;
  const start = firstDoseMinuteOn(medication, dateObj);
  if (start == null) return true;
  const mins = extractMedicationTimes(medication).map(timeStringToMinutes).filter((m) => m !== null);
  return mins.length === 0 ? start !== Infinity : mins.some((m) => m >= start);
}

export function checkMedicationTimeEligibility(medication, dateObj = new Date()) {
  // Kiểm tra thuốc cách ngày: nếu hôm nay là ngày nghỉ cữ
  const scheduleCheck = isDoseScheduledForDate(medication, dateObj);
  if (scheduleCheck.isRestDay) {
    return {
      isTimeArrived: false,
      isRestDay: true,
      restDayLabel: scheduleCheck.label,
      earliestUpcomingTime: null,
      isLate: false,
      activeSlotTime: null,
      times: extractMedicationTimes(medication)
    };
  }

  const times = extractMedicationTimes(medication);

  // Nếu thuốc không ghi bất kỳ giờ uống nào, mặc định cho phép uống để không khóa nhầm
  if (times.length === 0) {
    return {
      isTimeArrived: true,
      isRestDay: false,
      earliestUpcomingTime: null,
      isLate: false,
      activeSlotTime: null,
      times: []
    };
  }

  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  const firstDose = firstDoseMinuteOn(medication, dateObj);
  const allSlots = times.map(t => ({
    timeStr: t,
    minutes: timeStringToMinutes(t)
  })).filter(x => x.minutes !== null).sort((a, b) => a.minutes - b.minutes);
  // Bỏ các cữ trước lúc thêm thuốc (thuốc vừa thêm không bị coi là "quá giờ")
  const timesInMinutes = firstDose == null ? allSlots : allSlots.filter(x => x.minutes >= firstDose);

  if (allSlots.length > 0 && timesInMinutes.length === 0) {
    // Mọi cữ hôm nay đều trước lúc thêm thuốc -> cữ đầu tiên là ngày mai
    return {
      isTimeArrived: false,
      isRestDay: false,
      earliestUpcomingTime: null,
      startsTomorrowAt: allSlots[0].timeStr,
      isLate: false,
      activeSlotTime: null,
      times
    };
  }

  if (timesInMinutes.length === 0) {
    return {
      isTimeArrived: true,
      isRestDay: false,
      earliestUpcomingTime: null,
      isLate: false,
      activeSlotTime: null,
      times
    };
  }

  // Danh sách các cữ đã tới giờ hoặc đã qua (currentMinutes >= minutes)
  const arrivedTimes = timesInMinutes.filter(x => currentMinutes >= x.minutes);
  // Danh sách các cữ chưa tới giờ
  const futureTimes = timesInMinutes.filter(x => currentMinutes < x.minutes);

  const isTimeArrived = arrivedTimes.length > 0;
  const earliestUpcomingTime = futureTimes.length > 0 ? futureTimes[0].timeStr : null;

  // Cữ ĐANG được xác nhận (gần đây nhất trong số các cữ đã tới giờ) — dùng để biết chính xác
  // đây là cữ nào khi bệnh nhân bấm "Đã uống"/"Bỏ qua" (huỷ đúng thông báo nhắc lại của cữ đó).
  const activeSlotTime = arrivedTimes.length > 0 ? arrivedTimes[arrivedTimes.length - 1].timeStr : null;

  // Nếu đã qua giờ cữ gần nhất hơn 60 phút mà chưa uống
  const isLate = arrivedTimes.some(x => currentMinutes - x.minutes >= 60);

  return {
    isTimeArrived,
    isRestDay: false,
    earliestUpcomingTime,
    isLate,
    activeSlotTime,
    times
  };
}
