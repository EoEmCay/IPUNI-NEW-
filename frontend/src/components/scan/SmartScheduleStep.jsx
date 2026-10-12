import { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Sparkles, Pill, Lock } from 'lucide-react';
import { getSavedDrugVisual } from '../../utils/drugVisuals';

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
    rangeLabel: '04:00 – 12:00 (4h sáng – 12h trưa)',
    icon: '☀️',
    defaultTime: '07:00',
    minMinutes: 4 * 60,       // 04:00
    maxMinutes: 12 * 60,      // 12:00
    slots: buildHalfHourSlots(4, 0, 12, 0),
    presets: ['06:00', '06:30', '07:00', '07:30', '08:00', '09:00'],
    bg: '#EFF6FF',
    border: '#BFDBFE',
    accent: '#1D4ED8',
    badgeBg: '#DBEAFE',
  },
  {
    key: 'afternoon',
    label: 'Cử Buổi Chiều',
    shortLabel: 'Chiều',
    rangeLabel: '12:30 – 17:00 (12h30 trưa – 5h chiều)',
    icon: '🌇',
    defaultTime: '15:00',
    minMinutes: 12 * 60 + 30, // 12:30
    maxMinutes: 17 * 60,      // 17:00
    slots: buildHalfHourSlots(12, 30, 17, 0),
    presets: ['12:30', '13:30', '15:00', '16:00', '17:00'],
    bg: '#F0FDFA',
    border: '#99F6E4',
    accent: '#0F766E',
    badgeBg: '#CCFBF1',
  },
  {
    key: 'evening',
    label: 'Cử Buổi Tối',
    shortLabel: 'Tối',
    rangeLabel: '17:30 – 21:00 (5h30 chiều – 9h tối)',
    icon: '🌙',
    defaultTime: '18:30',
    minMinutes: 17 * 60 + 30, // 17:30
    maxMinutes: 21 * 60,      // 21:00
    slots: buildHalfHourSlots(17, 30, 21, 0),
    presets: ['17:30', '18:00', '18:30', '19:30', '20:30', '21:00'],
    bg: '#EEF2FF',
    border: '#C7D2FE',
    accent: '#4338CA',
    badgeBg: '#E0E7FF',
  },
];

const PERIOD_ORDER = ['morning', 'afternoon', 'evening'];

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
  if (mins >= 240 && mins <= 720) return 'morning';    // 04:00 - 12:00
  if (mins > 720 && mins <= 1020) return 'afternoon';  // 12:01 - 17:00 (khung chuẩn 12:30 - 17:00)
  return 'evening';                                    // 17:30 - 21:00
}

// Xác định CỐ ĐỊNH các cử uống trong đơn của bác sĩ (không cho tự ý đổi cử)
export function inferDoctorPeriods(med) {
  const found = new Set();
  const text = `${med?.instructions || ''} ${med?.frequency || ''}`.toLowerCase();

  // 1. Ưu tiên đọc đúng chữ bác sĩ ghi trong đơn (Sáng / Trưa / Chiều / Tối)
  if (text.includes('sáng')) found.add('morning');
  if (text.includes('chiều') || text.includes('trưa')) found.add('afternoon');
  if (text.includes('tối') || text.includes('ngủ') || text.includes('đêm')) found.add('evening');

  // 2. Nếu lời dặn không ghi chữ buổi rõ ràng, đọc từ mảng giờ bác sĩ chỉ định
  if (found.size === 0 && Array.isArray(med?.times) && med.times.length > 0) {
    med.times.forEach((t) => found.add(classifyTimeToPeriod(t)));
  }

  // 3. Fallback theo số lần/ngày trong đơn
  if (found.size === 0) {
    if (/3\s*lần/i.test(text)) {
      found.add('morning');
      found.add('afternoon');
      found.add('evening');
    } else if (/2\s*lần/i.test(text)) {
      found.add('morning');
      found.add('afternoon');
    } else {
      found.add('morning');
    }
  }

  return PERIOD_ORDER.filter((p) => found.has(p));
}

export default function SmartScheduleStep({ medications, onUpdateMedications }) {
  // Khởi tạo giờ uống cho 3 cử cố định (nằm nghiêm ngặt trong khung 4h-12h, 12h30-17h, 17h30-21h)
  const [periodTimes, setPeriodTimes] = useState(() => {
    const initial = {
      morning: '07:00',
      afternoon: '15:00',
      evening: '18:30',
    };
    (medications || []).forEach((med) => {
      (med.times || []).forEach((t) => {
        const clean = String(t || '').trim();
        if (/^\d{2}:\d{2}$/.test(clean)) {
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
    if (needsSync) {
      onUpdateMedications(synced);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi người dùng đổi khung giờ của 1 cử (VD: Cử Buổi Sáng 07:00 -> 07:30):
  // Khoá chặt trong khung giờ cho phép của cử đó và đồng bộ toàn bộ thuốc có liều trong cử đó
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
    onUpdateMedications(updatedMeds);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Banner giải thích cử bác sĩ cố định & khung giờ cho phép */}
      <div
        style={{
          background: '#F0FDF4',
          border: '1.5px solid #BBF7D0',
          borderRadius: 14,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          color: '#166534',
          fontSize: 13.5,
          lineHeight: 1.45,
          fontWeight: 600,
        }}
      >
        <Sparkles size={18} style={{ flexShrink: 0, marginTop: 2, color: '#16A34A' }} />
        <div>
          <strong>Cử uống cố định theo đơn bác sĩ:</strong> Các thuốc cùng cử đã được gom chung vào 1 ô và giữ nguyên cử Sáng / Chiều / Tối theo chỉ định. Bạn chỉ cần chọn giờ uống trong khung cố định của từng cử (<strong>Sáng: 04:00–12:00</strong> · <strong>Chiều: 12:30–17:00</strong> · <strong>Tối: 17:30–21:00</strong>), các thuốc cùng cử sẽ tự động đồng bộ!
        </div>
      </div>

      {/* Các ô gom nhóm thuốc theo từng Cử cố định */}
      {activeGroups.map((group) => (
        <div
          key={group.key}
          style={{
            background: '#FFFFFF',
            border: `2px solid ${group.border}`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Header của Ô Cử Uống + Bộ chọn khung giờ cố định */}
          <div
            style={{
              background: group.bg,
              padding: '12px 14px',
              borderBottom: `1.5px solid ${group.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{group.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{group.label}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        background: group.badgeBg,
                        color: group.accent,
                        padding: '2px 9px',
                        borderRadius: 999,
                      }}
                    >
                      {group.items.length} thuốc cùng cử
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                    Khung giờ cố định: <strong>{group.rangeLabel}</strong>
                  </div>
                </div>
              </div>

              {/* Bộ chọn khung giờ giới hạn nghiêm ngặt trong khoảng của cử */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color={group.accent} />
                <select
                  value={group.currentTime}
                  onChange={(e) => handlePeriodTimeChange(group.key, e.target.value)}
                  aria-label={`Chọn giờ cho ${group.label}`}
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: group.accent,
                    background: '#FFFFFF',
                    border: `2px solid ${group.accent}`,
                    borderRadius: 10,
                    padding: '6px 12px',
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

            {/* Các mốc giờ gợi ý bấm 1 chạm trong khung cố định */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginRight: 2 }}>
                Chọn nhanh trong khung:
              </span>
              {group.presets.map((preset) => {
                const isSelected = group.currentTime === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePeriodTimeChange(group.key, preset)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 800,
                      border: isSelected ? `2px solid ${group.accent}` : '1.5px solid #CBD5E1',
                      background: isSelected ? group.accent : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh sách các loại thuốc bác sĩ kê trong Cử này (Khoá cố định cử) */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.items.map(({ med, medIndex, doseNumber, totalDoses, otherPeriods, doctorPeriodsLabel }) => {
              const visual = getSavedDrugVisual(med.name);
              return (
                <div
                  key={`${group.key}-${medIndex}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {visual?.imageUrl ? (
                        <img
                          src={visual.imageUrl}
                          alt={med.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}
                        />
                      ) : (
                        <Pill size={20} color={group.accent} />
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>{med.name}</span>
                        {med.dosage && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                            ({med.dosage})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, fontWeight: 700, color: group.accent, marginTop: 2 }}>
                        {totalDoses === 1 ? (
                          <span>✓ Uống lúc {group.currentTime} ({group.label})</span>
                        ) : (
                          <span>
                            🔄 Liều {doseNumber}/{totalDoses} lúc {group.currentTime} · Đồng bộ cùng {otherPeriods.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nhãn cố định cử theo đơn bác sĩ (không cho tự ý đổi cử) */}
                  <div
                    title="Cử uống cố định theo chỉ định trong đơn của bác sĩ"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '5px 10px',
                      borderRadius: 8,
                      background: group.badgeBg,
                      color: group.accent,
                      border: `1px solid ${group.border}`,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Lock size={12} strokeWidth={2.5} />
                    <span>Đơn bác sĩ: {doctorPeriodsLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
