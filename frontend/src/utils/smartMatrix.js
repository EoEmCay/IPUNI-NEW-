/**
 * smartMatrix.js - Logic phân bổ lịch uống thuốc vào ma trận 7x4 CalenDIA+
 * 7 cột (Thứ Hai -> Chủ Nhật) x 4 hàng (Sáng, Trưa, Chiều, Tối) = 28 ngăn kéo
 */

export const DAYS = [
  { key: 'mon', label: 'Thứ Hai', short: 'T2', dayIndex: 1 },
  { key: 'tue', label: 'Thứ Ba', short: 'T3', dayIndex: 2 },
  { key: 'wed', label: 'Thứ Tư', short: 'T4', dayIndex: 3 },
  { key: 'thu', label: 'Thứ Năm', short: 'T5', dayIndex: 4 },
  { key: 'fri', label: 'Thứ Sáu', short: 'T6', dayIndex: 5 },
  { key: 'sat', label: 'Thứ Bảy', short: 'T7', dayIndex: 6 },
  { key: 'sun', label: 'Chủ Nhật', short: 'CN', dayIndex: 0 },
];

export const PERIODS = [
  {
    key: 'morning',
    label: 'Sáng',
    defaultTime: '07:00',
    range: '05:00 - 11:30',
    icon: '🌅',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    badgeBg: '#DBEAFE',
  },
  {
    key: 'noon',
    label: 'Trưa',
    defaultTime: '12:00',
    range: '11:30 - 13:30',
    icon: '☀️',
    color: '#B45309',
    bg: '#FEF3C7',
    badgeBg: '#FDE68A',
  },
  {
    key: 'afternoon',
    label: 'Chiều',
    defaultTime: '15:00',
    range: '13:30 - 17:30',
    icon: '☕',
    color: '#0F766E',
    bg: '#CCFBF1',
    badgeBg: '#99F6E4',
  },
  {
    key: 'evening',
    label: 'Tối',
    defaultTime: '19:00',
    range: '17:30 - 21:30',
    icon: '🌙',
    color: '#4338CA',
    bg: '#EEF2FF',
    badgeBg: '#E0E7FF',
  },
];

// Hàm suy luận cữ uống (Sáng, Trưa, Chiều, Tối) từ đơn thuốc
export function inferPeriodsForMed(med) {
  const found = new Set();
  const text = `${med?.instructions || ''} ${med?.frequency || ''} ${med?.timing || ''}`.toLowerCase();

  if (text.includes('sáng')) found.add('morning');
  if (text.includes('trưa')) found.add('noon');
  if (text.includes('chiều')) found.add('afternoon');
  if (text.includes('tối') || text.includes('ngủ') || text.includes('đêm')) found.add('evening');

  // Nếu trong đơn có mảng giờ cụ thể
  if (found.size === 0 && Array.isArray(med?.times) && med.times.length > 0) {
    med.times.forEach((t) => {
      const match = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        const mins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        if (mins < 11 * 60 + 30) found.add('morning');
        else if (mins < 13 * 60 + 30) found.add('noon');
        else if (mins < 17 * 60 + 30) found.add('afternoon');
        else found.add('evening');
      }
    });
  }

  // Fallback số lần/ngày
  if (found.size === 0) {
    if (/4\s*lần/i.test(text)) {
      found.add('morning');
      found.add('noon');
      found.add('afternoon');
      found.add('evening');
    } else if (/3\s*lần/i.test(text)) {
      found.add('morning');
      found.add('noon');
      found.add('evening');
    } else if (/2\s*lần/i.test(text)) {
      found.add('morning');
      found.add('evening');
    } else {
      found.add('morning');
    }
  }

  return PERIODS.map((p) => p.key).filter((k) => found.has(k));
}

// Hàm suy luận ngày uống trong tuần
export function inferDaysForMed(med) {
  const text = `${med?.frequency || ''} ${med?.instructions || ''}`.toLowerCase();
  if (text.includes('2-4-6') || text.includes('thứ 2, 4, 6') || text.includes('thứ 2,4,6')) {
    return ['mon', 'wed', 'fri'];
  }
  if (text.includes('3-5-7') || text.includes('thứ 3, 5, 7') || text.includes('thứ 3,5,7')) {
    return ['tue', 'thu', 'sat'];
  }
  if (text.includes('cách ngày') || text.includes('mỗi 2 ngày') || text.includes('2 ngày 1 lần')) {
    return ['mon', 'wed', 'fri', 'sun'];
  }
  // Mặc định: Uống hàng ngày cả 7 ngày
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
}
