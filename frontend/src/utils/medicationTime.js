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

  // Nếu không có times rõ ràng, quét trong frequency, timing, instructions
  if (result.length === 0) {
    const text = `${medication.frequency || ''} ${medication.timing || ''} ${medication.instructions || ''}`.toLowerCase();
    
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
      if (text.includes('trưa')) result.push('11:30');
      if (text.includes('chiều')) result.push('15:00');
      if (text.includes('tối')) result.push('18:30');
      if (text.includes('ngủ') || text.includes('đêm')) result.push('21:30');
    }
  }

  // Chuẩn hóa dạng HH:mm
  return result.map(t => {
    const clean = t.replace(/[^0-9:]/g, '');
    const [h, m] = clean.split(':');
    if (h != null && m != null) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return t;
  }).filter(t => /^\d{2}:\d{2}$/.test(t));
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
export function checkMedicationTimeEligibility(medication, dateObj = new Date()) {
  const times = extractMedicationTimes(medication);

  // Nếu thuốc không ghi bất kỳ giờ uống nào, mặc định cho phép uống để không khóa nhầm
  if (times.length === 0) {
    return {
      isTimeArrived: true,
      earliestUpcomingTime: null,
      isLate: false,
      times: []
    };
  }

  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  const timesInMinutes = times.map(t => ({
    timeStr: t,
    minutes: timeStringToMinutes(t)
  })).filter(x => x.minutes !== null).sort((a, b) => a.minutes - b.minutes);

  if (timesInMinutes.length === 0) {
    return {
      isTimeArrived: true,
      earliestUpcomingTime: null,
      isLate: false,
      times
    };
  }

  // Danh sách các cữ đã tới giờ hoặc đã qua (currentMinutes >= minutes)
  const arrivedTimes = timesInMinutes.filter(x => currentMinutes >= x.minutes);
  // Danh sách các cữ chưa tới giờ
  const futureTimes = timesInMinutes.filter(x => currentMinutes < x.minutes);

  const isTimeArrived = arrivedTimes.length > 0;
  const earliestUpcomingTime = futureTimes.length > 0 ? futureTimes[0].timeStr : null;

  // Nếu đã qua giờ cữ gần nhất hơn 60 phút mà chưa uống
  const isLate = arrivedTimes.some(x => currentMinutes - x.minutes >= 60);

  return {
    isTimeArrived,
    earliestUpcomingTime,
    isLate,
    times
  };
}
