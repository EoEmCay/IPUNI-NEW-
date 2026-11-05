import { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Sparkles, Pill, Lock } from 'lucide-react';
import { getSavedDrugVisual } from '../../utils/drugVisuals';
import SmartPillMatrix from '../medications/SmartPillMatrix';

// Hàm tạo danh sách các mốc giờ (bước nhảy 30 phút) nằm gọn trong khung giờ cố định của từng cử
function buildHalfHourSlots(startHour, startMin, endHour, endMin) {
  const slots = [];
  let cur = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  while (cur <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += 30;
  }
  return slots;
}

export const PERIOD_DEFS = [
  {
    key: 'morning',
    label: 'Cử Buổi Sáng',
    shortLabel: 'Sáng',
    rangeLabel: '05:00 – 11:30 (5h sáng – 11h30 trưa)',
    icon: '🌅',
    defaultTime: '07:00',
    minMinutes: 5 * 60,
    maxMinutes: 11 * 60 + 30,
    slots: buildHalfHourSlots(5, 0, 11, 30),
    presets: ['06:00', '07:00', '08:00', '09:00', '11:00'],
    bg: '#EFF6FF',
    border: '#BFDBFE',
    accent: '#1D4ED8',
    badgeBg: '#DBEAFE',
  },
  {
    key: 'noon',
    label: 'Cử Buổi Trưa',
    shortLabel: 'Trưa',
    rangeLabel: '11:30 – 13:30 (11h30 trưa – 1h30 chiều)',
    icon: '☀️',
    defaultTime: '12:00',
    minMinutes: 11 * 60 + 30,
    maxMinutes: 13 * 60 + 30,
    slots: buildHalfHourSlots(11, 30, 13, 30),
    presets: ['11:30', '12:00', '12:30', '13:00', '13:30'],
    bg: '#FEF3C7',
    border: '#FDE68A',
    accent: '#B45309',
    badgeBg: '#FEF3C7',
  },
  {
    key: 'afternoon',
    label: 'Cử Buổi Chiều',
    shortLabel: 'Chiều',
    rangeLabel: '13:30 – 17:30 (1h30 chiều – 5h30 chiều)',
    icon: '☕',
    defaultTime: '15:00',
    minMinutes: 13 * 60 + 30,
    maxMinutes: 17 * 60 + 30,
    slots: buildHalfHourSlots(13, 30, 17, 30),
    presets: ['14:00', '15:00', '16:00', '17:00'],
    bg: '#F0FDFA',
    border: '#99F6E4',
    accent: '#0F766E',
    badgeBg: '#CCFBF1',
  },
  {
    key: 'evening',
    label: 'Cử Buổi Tối',
    shortLabel: 'Tối',
    rangeLabel: '17:30 – 21:30 (5h30 chiều – 9h30 tối)',
    icon: '🌙',
    defaultTime: '19:00',
    minMinutes: 17 * 60 + 30,
    maxMinutes: 21 * 60 + 30,
    slots: buildHalfHourSlots(17, 30, 21, 30),
    presets: ['18:00', '18:30', '19:00', '20:00', '21:00'],
    bg: '#EEF2FF',
    border: '#C7D2FE',
    accent: '#4338CA',
    badgeBg: '#E0E7FF',
  },
];

const PERIOD_ORDER = ['morning', 'noon', 'afternoon', 'evening'];

function parseMinutes(timeStr) {
  const m = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// Đưa một mốc giờ bất kỳ về đúng mốc hợp lệ trong khung giờ cố định của cử đó
export function clampTimeToPeriod(periodKey, timeStr) {
  const def = PERIOD_DEFS.find((d) => d.key === periodKey);
  if (!def) return '07:00';
  const mins = parseMinutes(timeStr);
  if (mins === null) return def.defaultTime;
  const clamped = Math.max(def.minMinutes, Math.min(def.maxMinutes, mins));
  // Làm tròn về mốc 30 phút gần nhất trong khung để luôn khớp danh sách khung giờ
  const snapped = Math.round(clamped / 30) * 30;
  const finalMins = Math.max(def.minMinutes, Math.min(def.maxMinutes, snapped));
  const h = String(Math.floor(finalMins / 60)).padStart(2, '0');
  const m = String(finalMins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function classifyTimeToPeriod(timeStr) {
  const mins = parseMinutes(timeStr);
  if (mins === null) return 'morning';
  if (mins < 11 * 60 + 30) return 'morning';    // 05:00 - 11:29
  if (mins < 13 * 60 + 30) return 'noon';       // 11:30 - 13:29
  if (mins < 17 * 60 + 30) return 'afternoon';  // 13:30 - 17:29
  return 'evening';                             // 17:30 - 21:30
}

// Xác định CỐ ĐỊNH các cử uống trong đơn của bác sĩ (Sáng / Trưa / Chiều / Tối)
export function inferDoctorPeriods(med) {
  const found = new Set();
  const text = `${med?.instructions || ''} ${med?.frequency || ''} ${med?.timing || ''}`.toLowerCase();

  // 1. Ưu tiên đọc đúng chữ bác sĩ ghi trong đơn (Sáng / Trưa / Chiều / Tối)
  if (text.includes('sáng')) found.add('morning');
  if (text.includes('trưa')) found.add('noon');
  if (text.includes('chiều')) found.add('afternoon');
  if (text.includes('tối') || text.includes('ngủ') || text.includes('đêm')) found.add('evening');

  // 2. Nếu lời dặn không ghi chữ buổi rõ ràng, đọc từ mảng giờ bác sĩ chỉ định
  if (found.size === 0 && Array.isArray(med?.times) && med.times.length > 0) {
    med.times.forEach((t) => found.add(classifyTimeToPeriod(t)));
  }

  // 3. Fallback theo số lần/ngày trong đơn
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

  return PERIOD_ORDER.filter((p) => found.has(p));
}

export default function SmartScheduleStep({
  medications = [],
  onUpdateMedications,
  onConfirm = null,
}) {
  // Khởi tạo giờ uống cho 4 cử cố định
  const [periodTimes, setPeriodTimes] = useState(() => {
    const initial = {
      morning: '07:00',
      noon: '12:00',
      afternoon: '15:00',
      evening: '19:00',
    };
    (medications || []).forEach((med) => {
      (med.times || []).forEach((t) => {
        const clean = String(t || '').trim();
        if (/^\d{1,2}:\d{2}$/.test(clean)) {
          const p = classifyTimeToPeriod(clean);
          initial[p] = clampTimeToPeriod(p, clean);
        }
      });
    });
    return initial;
  });

  // Đồng bộ giờ của tất cả thuốc theo đúng cử cố định của bác sĩ ngay khi vào bước 3
  useEffect(() => {
    if (!medications || medications.length === 0) return;
    let needsSync = false;
    const synced = medications.map((med) => {
      const periods = inferDoctorPeriods(med);
      const nextTimes = periods.map((p) => periodTimes[p]);
      const currTimes = Array.isArray(med.times) ? med.times : [];
      if (
        currTimes.length !== nextTimes.length ||
        currTimes.some((t, idx) => t !== nextTimes[idx])
      ) {
        needsSync = true;
        return { ...med, periods, times: nextTimes };
      }
      return med;
    });
    if (needsSync && onUpdateMedications) {
      onUpdateMedications(synced);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi người dùng đổi khung giờ của 1 cử (VD: Cử Buổi Sáng 07:00 -> 07:30)
  const handlePeriodTimeChange = (periodKey, rawNewTime) => {
    if (!rawNewTime) return;
    const validTime = clampTimeToPeriod(periodKey, rawNewTime);
    const nextClock = { ...periodTimes, [periodKey]: validTime };
    setPeriodTimes(nextClock);

    const updatedMeds = (medications || []).map((med) => {
      const periods = inferDoctorPeriods(med);
      const nextTimes = periods.map((p) => nextClock[p]);
      return {
        ...med,
        periods,
        times: nextTimes,
      };
    });
    if (onUpdateMedications) {
      onUpdateMedications(updatedMeds);
    }
  };

  // Gom nhóm các thuốc theo từng cử cố định của bác sĩ
  const groupedByPeriod = useMemo(() => {
    return PERIOD_DEFS.map((def) => {
      const items = [];
      (medications || []).forEach((med, medIndex) => {
        const periods = inferDoctorPeriods(med);
        if (periods.includes(def.key)) {
          const doseNumber = periods.indexOf(def.key) + 1;
          const totalDoses = periods.length;
          const otherPeriods = periods
            .filter((p) => p !== def.key)
            .map((p) => {
              const pDef = PERIOD_DEFS.find((d) => d.key === p);
              return `Cử ${pDef?.shortLabel} (${periodTimes[p]})`;
            });
          const doctorPeriodsLabel = periods
            .map((p) => PERIOD_DEFS.find((d) => d.key === p)?.shortLabel)
            .filter(Boolean)
            .join(' + ');

          items.push({
            med,
            medIndex,
            periods,
            doseNumber,
            totalDoses,
            otherPeriods,
            doctorPeriodsLabel,
          });
        }
      });
      return {
        ...def,
        currentTime: periodTimes[def.key],
        items,
      };
    });
  }, [medications, periodTimes]);

  const activeGroups = groupedByPeriod.filter((g) => g.items.length > 0);

  // Khi bấm "Ok" từ ma trận 7x4
  const handleMatrixConfirm = (syncedMeds) => {
    if (onUpdateMedications) {
      onUpdateMedications(syncedMeds);
    }
    if (onConfirm) {
      onConfirm(syncedMeds);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── 1. MA TRẬN HỘP THUỐC 7x4 CALENDIA+ ── */}
      <SmartPillMatrix
        medications={medications}
        isScanReview={true}
        onConfirm={handleMatrixConfirm}
        onChange={(nextMatrix) => {
          // Khi người dùng chỉnh sửa từng ô trong ma trận, cập nhật lại times
        }}
      />

      {/* ── 2. ĐIỀU CHỈNH GIỜ CHI TIẾT THEO TỪNG CỬ BÁC SĨ (OPTIONAL) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', margin: 0 }}>
          Điều chỉnh giờ chuông báo cho từng cữ:
        </h4>

        {activeGroups.map((group) => (
          <div
            key={group.key}
            style={{
              background: '#FFFFFF',
              border: `1.5px solid ${group.border}`,
              borderRadius: 14,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <strong style={{ fontSize: 14, color: '#0F172A' }}>{group.label}</strong>
                <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>
                  ({group.items.length} thuốc)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={group.accent} />
              <select
                value={group.currentTime}
                onChange={(e) => handlePeriodTimeChange(group.key, e.target.value)}
                aria-label={`Chọn giờ cho ${group.label}`}
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: group.accent,
                  background: '#FFFFFF',
                  border: `1.5px solid ${group.accent}`,
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {group.slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
