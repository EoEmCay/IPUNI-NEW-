import { useState, useMemo, useEffect } from 'react';
import { Pill, Syringe, ChevronRight, XCircle, Camera, RotateCcw } from 'lucide-react';
import useMedicationsStore from '../../store/medicationsStore';
import {
  recordMedicationIntake,
  getMedicationDayProgress,
} from '../../store/medicationAdherenceStore';
import MedicationDetailModal from './MedicationDetailModal';
import SkipDoseModal from './SkipDoseModal';
import { checkMedicationTimeEligibility } from '../../utils/medicationTime';
import { cancelFollowupReminder, buildTodayInstant } from '../../lib/medReminders';
import { useT } from '../../hooks/useT';
import { isInjection } from '../../utils/medForm';
import { getSavedDrugVisual, fetchAndCacheDrugVisual } from '../../utils/drugVisuals';
import styles from './MedicationCard.module.css';

const STATUS_STYLES = {
  taken: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  waitingNext: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  partial: { bg: '#0EA5E9', color: '#FFFFFF', border: '#0284C7' },
  late: { bg: '#DC2626', color: '#fff', border: '#DC2626' },
  skipped: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
};

export default function MedicationCard({ medication }) {
  const times = Array.isArray(medication.times) ? medication.times.join(' & ') : medication.times;
  const { medicationStatus, statusVersion } = useMedicationsStore();
  const [showDetail, setShowDetail] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visual, setVisual] = useState(() => getSavedDrugVisual(medication?.name));
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const t = useT();
  // Thuốc tiêm (insulin, GLP-1): nói "tiêm" thay cho "uống" để người lớn tuổi không nhầm
  const injection = isInjection(medication);
  const verb = injection ? 'tiêm' : 'uống';

  useEffect(() => {
    let active = true;
    if (!medication?.name) return;
    setCandidateIdx(0);
    setAllFailed(false);
    setVisual(getSavedDrugVisual(medication.name));
    fetchAndCacheDrugVisual(medication.name).then((res) => {
      if (active && res) {
        setVisual(res);
        setCandidateIdx(0);
        setAllFailed(false);
      }
    });
    return () => { active = false; };
  }, [medication?.name, showDetail]);

  // Cập nhật giờ mỗi 30s để tự động mở khóa khi tới giờ uống, đồng thời nghe sự kiện đồng bộ
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    const handleSync = () => {
      setSyncTick((t) => t + 1);
      setCurrentTime(new Date());
    };
    window.addEventListener('medicationIntakeChanged', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('medicationIntakeChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Kiểm tra xem đã tới giờ uống chưa
  const timeEligibility = useMemo(() => {
    return checkMedicationTimeEligibility(medication, currentTime);
  }, [medication, currentTime]);

  const dayProgress = useMemo(() => {
    return getMedicationDayProgress(medication, currentTime);
  }, [medication, currentTime, medicationStatus, statusVersion, syncTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRestDay = timeEligibility.isRestDay;
  const isTaken = !isRestDay && dayProgress.isAllTaken;
  const isSkipped = !isRestDay && !isTaken && dayProgress.isAllDone && dayProgress.skippedSlots >= dayProgress.totalSlots;
  const isPartial = !isRestDay && dayProgress.isPartial;
  // Đã uống xong cử trước (ví dụ Cử sáng 09:00), đang chờ tới giờ cử tiếp theo (ví dụ Cử chiều 16:00 chưa tới giờ)
  const isWaitingNextSlot = isPartial && !dayProgress.isNextSlotArrived;
  // Chưa uống cử nào và cử đầu tiên trong ngày vẫn chưa tới giờ
  const isLocked = !isRestDay && !isTaken && !isSkipped && !isPartial && !dayProgress.isNextSlotArrived;
  // Chỉ báo "Đã quá giờ" khi cử ĐANG CẦN UỐNG hiện tại thực sự bị trễ >= 60 phút
  const isLate = !isRestDay && !isTaken && !isSkipped && dayProgress.isNextSlotLate;

  const nextSlot = dayProgress.nextPendingSlot;
  const lastCompletedSlot = dayProgress.lastCompletedSlot;

  // Huỷ thông báo nhắc lại (Lần 2, sau 15 phút) của cữ ĐANG được xác nhận (uống hoặc bỏ qua),
  // để máy không đổ chuông oan 15 phút sau khi bệnh nhân đã phản hồi rồi.
  const cancelActiveFollowup = (targetSlotTime) => {
    const slotT = targetSlotTime || timeEligibility.activeSlotTime;
    if (!slotT) return;
    const instantIso = buildTodayInstant(slotT, currentTime);
    if (instantIso) cancelFollowupReminder(instantIso);
  };

  const handleUndoLastSlot = () => {
    recordMedicationIntake(medication, 'pending', new Date(), null, null);
    const undoneLabel = lastCompletedSlot
      ? `${lastCompletedSlot.periodLabel.toLowerCase()} (${lastCompletedSlot.time})`
      : '';
    setToastMsg(`Đã hoàn tác ${undoneLabel}. Bác có thể bấm xác nhận lại khi cần nhé!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStatusToggle = () => {
    if (isRestDay) {
      setToastMsg(`Hôm nay là ngày nghỉ cữ của ${medication.name}. Bác không cần uống hôm nay nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (isLocked) {
      const timeHint = nextSlot?.time
        || timeEligibility.earliestUpcomingTime
        || (timeEligibility.startsTomorrowAt ? `ngày mai ${timeEligibility.startsTomorrowAt}` : 'sau');
      setToastMsg(`Chưa tới giờ ${verb} ${medication.name} (Lịch: ${timeHint}). Vui lòng ${verb} đúng giờ nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (isWaitingNextSlot) {
      const doneLabel = lastCompletedSlot
        ? `${lastCompletedSlot.periodLabel.toLowerCase()} (${lastCompletedSlot.time})`
        : 'cử trước';
      const upcomingLabel = nextSlot
        ? `${nextSlot.periodLabel.toLowerCase()} lúc ${nextSlot.time}`
        : 'cử tiếp theo';
      setToastMsg(`Bác đã ${verb} ${doneLabel} rồi! Tới ${upcomingLabel} hệ thống sẽ mở tiếp nhé.`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (isTaken || isSkipped) {
      handleUndoLastSlot();
      return;
    }

    const targetKey = nextSlot ? nextSlot.key : (timeEligibility.activeSlotTime || 'morning');
    recordMedicationIntake(medication, 'taken', new Date(), null, targetKey);
    cancelActiveFollowup(nextSlot?.time);
  };

  const handleSkipConfirm = async (reason) => {
    const targetKey = nextSlot ? nextSlot.key : (timeEligibility.activeSlotTime || 'morning');
    recordMedicationIntake(medication, 'skipped', new Date(), reason, targetKey);
    cancelActiveFollowup(nextSlot?.time);
    setShowSkipModal(false);
  };

  // Xác định text hiển thị trên nút
  let buttonLabel;
  if (isRestDay) {
    buttonLabel = 'Nghỉ cữ';
  } else if (isTaken) {
    const baseTaken = injection ? '✓ Đã tiêm' : `✓ ${t.medCard?.statusTaken || 'Đã uống'}`;
    buttonLabel = dayProgress.totalSlots > 1
      ? `${baseTaken} đủ hôm nay (${dayProgress.totalSlots}/${dayProgress.totalSlots} cử)`
      : `${baseTaken} hôm nay`;
  } else if (isWaitingNextSlot) {
    const doneSlotName = lastCompletedSlot?.periodLabel?.toLowerCase() || 'cử trước';
    const nextSlotInfo = nextSlot ? `${nextSlot.periodLabel} lúc ${nextSlot.time}` : 'Chờ cử tiếp';
    buttonLabel = `✓ Đã ${verb} ${doneSlotName} (${dayProgress.completedSlots}/${dayProgress.totalSlots} cử) · ${nextSlotInfo}`;
  } else if (isPartial) {
    const nextLabel = nextSlot?.periodLabel?.toLowerCase() || 'cử tiếp';
    const nextTime = nextSlot?.time ? ` (${nextSlot.time})` : '';
    buttonLabel = `✓ Tôi đã ${verb} ${nextLabel}${nextTime}`;
  } else if (isSkipped) {
    buttonLabel = '⏭ Đã bỏ qua hôm nay';
  } else if (isLocked) {
    const upcomingTime = nextSlot?.time || timeEligibility.earliestUpcomingTime;
    const upcomingPeriod = nextSlot?.periodLabel ? `${nextSlot.periodLabel} lúc ` : `${injection ? 'Tiêm' : 'Uống'} lúc `;
    buttonLabel = upcomingTime
      ? `${upcomingPeriod}${upcomingTime}`
      : timeEligibility.startsTomorrowAt
      ? `${injection ? 'Tiêm' : 'Uống'} từ mai lúc ${timeEligibility.startsTomorrowAt}`
      : `Chưa tới giờ ${verb}`;
  } else {
    const firstLabel = nextSlot?.periodLabel?.toLowerCase();
    const firstTime = nextSlot?.time ? ` (${nextSlot.time})` : '';
    buttonLabel = dayProgress.totalSlots > 1 && firstLabel
      ? `✓ Tôi đã ${verb} ${firstLabel}${firstTime}`
      : `✓ Tôi đã ${verb}${firstTime}`;
  }

  // Chỉ hiện nút "Bỏ qua cữ" khi cử hiện tại đã tới giờ và đang chờ uống
  const canSkip = !isRestDay && !isTaken && !isSkipped && !isLocked && !isWaitingNextSlot;
  const canUndo = !isRestDay && dayProgress.completedSlots > 0;
  const candidates = visual?.candidates?.length
    ? visual.candidates
    : visual?.imageUrl
    ? [visual.imageUrl]
    : [];
  const activeImgUrl = !allFailed ? (candidates[candidateIdx] || visual?.imageUrl) : null;

  const handleImgError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((idx) => idx + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div className={styles.card}>
      {activeImgUrl ? (
        <div
          onClick={() => setShowDetail(true)}
          style={{
            width: 68,
            height: 68,
            borderRadius: 14,
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer'
          }}
          title="Chạm để xem ảnh hộp thuốc to hoặc đổi ảnh"
        >
          <img
            src={activeImgUrl}
            alt={medication.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
            onError={handleImgError}
          />
        </div>
      ) : (
        <div className={styles.iconWrap} onClick={() => setShowDetail(true)} style={{ cursor: 'pointer' }}>
          {injection ? <Syringe size={22} /> : <Pill size={22} />}
        </div>
      )}
      <div className={styles.info}>
        <div className={styles.name}>
          {medication.name}{' '}
          {medication.dosage && (
            <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
              {medication.dosage}
            </span>
          )}
        </div>
        {visual?.commonName && (
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '2px 8px', borderRadius: 999, marginTop: 3 }}>
            {visual.commonName}
          </div>
        )}
        <div className={styles.frequency}>{medication.frequency}: {times}</div>

        {/* Hiển thị rõ trạng thái của từng cử trong ngày để người dùng không bao giờ bị nhầm lẫn */}
        {!isRestDay && dayProgress.slots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {dayProgress.slots.map((slot) => {
              let badgeBg = '#F8FAFC';
              let badgeColor = '#64748B';
              let badgeBorder = '#E2E8F0';
              let statusText = 'Chưa tới giờ';
              let prefixIcon = '○';

              if (slot.status === 'taken') {
                badgeBg = '#DCFCE7';
                badgeColor = '#15803D';
                badgeBorder = '#86EFAC';
                statusText = `Đã ${verb}`;
                prefixIcon = '✓';
              } else if (slot.status === 'skipped') {
                badgeBg = '#F1F5F9';
                badgeColor = '#475569';
                badgeBorder = '#CBD5E1';
                statusText = 'Đã bỏ qua';
                prefixIcon = '—';
              } else if (slot.isLate) {
                badgeBg = '#FEE2E2';
                badgeColor = '#B91C1C';
                badgeBorder = '#FCA5A5';
                statusText = 'Quá giờ';
                prefixIcon = '!';
              } else if (slot.isArrived) {
                badgeBg = '#DBEAFE';
                badgeColor = '#1D4ED8';
                badgeBorder = '#93C5FD';
                statusText = `Đến giờ ${verb}`;
                prefixIcon = '●';
              }

              return (
                <span
                  key={slot.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    color: badgeColor,
                    background: badgeBg,
                    border: `1.5px solid ${badgeBorder}`,
                    padding: '3px 9px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prefixIcon} {slot.periodLabel} ({slot.time}): {statusText}
                </span>
              );
            })}
          </div>
        )}

        {visual?.appearance && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '4px 8px', borderRadius: 8, marginTop: 6 }}>
            {visual.appearance}
          </div>
        )}
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {isLate && (
          <div className={styles.lateNote}>
            Đã quá giờ {verb} {nextSlot ? `${nextSlot.periodLabel.toLowerCase()} (${nextSlot.time})` : ''}
          </div>
        )}
        {isRestDay && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 13, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              Uống cách ngày • Hôm nay nghỉ cữ
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <button className={styles.detailBtn} onClick={() => setShowDetail(true)} style={{ whiteSpace: 'nowrap' }}>
            <Camera size={14} style={{ marginRight: 3, flexShrink: 0 }} /> {t.medCard?.details || 'Ảnh & Chi tiết'} <ChevronRight size={13} style={{ flexShrink: 0 }} />
          </button>
          {canSkip && (
            <button className={styles.skipBtn} onClick={() => setShowSkipModal(true)} style={{ whiteSpace: 'nowrap' }}>
              <XCircle size={13} style={{ flexShrink: 0 }} /> Bỏ qua {nextSlot ? nextSlot.periodLabel.toLowerCase() : 'cữ'}
            </button>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndoLastSlot}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                minHeight: 48,
                padding: '8px 12px',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 600,
                color: '#475569',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Hoàn tác cử vừa đánh dấu"
            >
              <RotateCcw size={14} style={{ flexShrink: 0 }} /> Hoàn tác
            </button>
          )}
        </div>
      </div>

      <button
        className={`${styles.statusSelect} ${isLocked ? styles.statusSelectLocked : ''}`}
        onClick={handleStatusToggle}
        aria-disabled={isLocked || undefined}
        style={
          isRestDay
            ? { background: '#F3F4F6', color: '#9CA3AF', borderColor: '#E5E7EB', cursor: 'pointer' }
            : isLocked
            ? {}
            : isTaken
            ? { background: STATUS_STYLES.taken.bg, color: STATUS_STYLES.taken.color, borderColor: STATUS_STYLES.taken.border, cursor: 'pointer' }
            : isWaitingNextSlot
            ? { background: STATUS_STYLES.waitingNext.bg, color: STATUS_STYLES.waitingNext.color, borderColor: STATUS_STYLES.waitingNext.border, cursor: 'pointer' }
            : isSkipped
            ? { background: STATUS_STYLES.skipped.bg, color: STATUS_STYLES.skipped.color, borderColor: STATUS_STYLES.skipped.border, cursor: 'pointer' }
            : isLate
            ? { background: STATUS_STYLES.late.bg, color: STATUS_STYLES.late.color, borderColor: STATUS_STYLES.late.border, cursor: 'pointer' }
            : isPartial
            ? { background: STATUS_STYLES.partial.bg, color: STATUS_STYLES.partial.color, borderColor: STATUS_STYLES.partial.border, cursor: 'pointer' }
            : { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)', cursor: 'pointer' }
        }
        title={
          isRestDay
            ? 'Hôm nay là ngày nghỉ cữ của thuốc này'
            : isLocked
            ? `Chưa tới giờ ${verb} (${nextSlot?.time || timeEligibility.earliestUpcomingTime || ''}). Sẽ cho phép chọn khi tới giờ!`
            : isTaken
            ? 'Đã uống đủ hôm nay - Bấm để hoàn tác'
            : isWaitingNextSlot
            ? `Đã ${verb} ${lastCompletedSlot?.periodLabel?.toLowerCase() || 'cử trước'} (${dayProgress.completedSlots}/${dayProgress.totalSlots} cử). Cử tiếp theo lúc ${nextSlot?.time || ''}`
            : isPartial
            ? `Đã uống ${dayProgress.takenCount}/${dayProgress.totalSlots} cử - Bấm để đánh dấu ${nextSlot?.periodLabel?.toLowerCase() || 'cử tiếp theo'}`
            : isSkipped
            ? 'Đã bỏ qua hôm nay - Bấm để hoàn tác'
            : 'Bấm để đánh dấu đã uống'
        }
      >
        {buttonLabel}
      </button>

      {toastMsg && (
        <div className={styles.timeToast}>
          {toastMsg}
        </div>
      )}

      {showDetail && (
        <MedicationDetailModal medication={medication} onClose={() => setShowDetail(false)} />
      )}

      {showSkipModal && (
        <SkipDoseModal
          medication={medication}
          onConfirm={handleSkipConfirm}
          onClose={() => setShowSkipModal(false)}
        />
      )}
    </div>
  );
}
