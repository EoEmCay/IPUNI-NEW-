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

export const MATRIX_STORAGE_KEY = 'diaplus_smart_matrix_v1';

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

/**
 * Đồng bộ danh sách thuốc dựa theo các ô đã phân bổ trong ma trận 7x4
 */
export function syncMedicationsFromMatrix(medications, matrixData, periodTimes) {
  return (medications || []).map((med, medIndex) => {
    const activePeriods = new Set();
    const activeDays = new Set();

    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        const key = `${d.key}_${p.key}`;
        if (matrixData[key] && matrixData[key].includes(medIndex)) {
          activePeriods.add(p.key);
          activeDays.add(d.dayIndex);
        }
      });
    });

    const nextTimes = Array.from(activePeriods)
      .sort((a, b) => PERIODS.findIndex((p) => p.key === a) - PERIODS.findIndex((p) => p.key === b))
      .map((p) => periodTimes[p]);

    return {
      ...med,
      times: nextTimes.length > 0 ? nextTimes : (med.times && med.times.length > 0 ? med.times : [periodTimes.morning]),
      slots: Array.from(activePeriods),
      days_of_week: Array.from(activeDays).sort((a, b) => a - b),
    };
  });
}

/**
 * Lưu trạng thái ma trận 28 ngăn vào localStorage
 */
export function saveMatrixToStorage(matrixData, medications) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const toSave = {
      _saved: true,
      timestamp: Date.now(),
    };

    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        const key = `${d.key}_${p.key}`;
        const indices = matrixData[key] || [];
        toSave[key] = indices
          .map((idx) => {
            const med = medications[idx];
            if (!med) return null;
            return {
              id: med.id ?? null,
              name: med.name || '',
            };
          })
          .filter(Boolean);
      });
    });

    localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error('saveMatrixToStorage error:', e);
    return false;
  }
}

/**
 * Tải trạng thái ma trận 28 ngăn từ localStorage
 */
export function loadMatrixFromStorage(medications) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(MATRIX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || !parsed) return null;

    const restored = {};
    let matchedAny = false;

    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        const key = `${d.key}_${p.key}`;
        const savedList = parsed[key];
        if (!Array.isArray(savedList)) {
          restored[key] = [];
          return;
        }

        const indices = [];
        savedList.forEach((item) => {
          const targetId = typeof item === 'object' && item !== null ? item.id : item;
          const targetName =
            typeof item === 'object' && item !== null
              ? item.name
              : typeof item === 'string'
              ? item
              : null;

          const idx = (medications || []).findIndex((m) => {
            if (targetId != null && targetId !== '' && (m.id === targetId || String(m.id) === String(targetId))) {
              return true;
            }
            if (targetName && m.name && m.name.toLowerCase().trim() === targetName.toLowerCase().trim()) {
              return true;
            }
            return false;
          });

          if (idx !== -1 && !indices.includes(idx)) {
            indices.push(idx);
            matchedAny = true;
          }
        });

        restored[key] = indices;
      });
    });

    // Nếu đã từng lưu (_saved = true) hoặc khớp ít nhất 1 thuốc, trả về restored
    if (parsed._saved || matchedAny) {
      return restored;
    }
    return null;
  } catch {
    return null;
  }
}
