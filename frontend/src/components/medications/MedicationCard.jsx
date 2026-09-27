import { useState, useMemo, useEffect } from 'react';
import { Pill, Syringe, ChevronRight, XCircle } from 'lucide-react';
import useMedicationsStore from '../../store/medicationsStore';
import { recordMedicationIntake } from '../../store/medicationAdherenceStore';
import MedicationDetailModal from './MedicationDetailModal';
import SkipDoseModal from './SkipDoseModal';
import { checkMedicationTimeEligibility } from '../../utils/medicationTime';
import { cancelFollowupReminder, buildTodayInstant } from '../../lib/medReminders';
import { useT } from '../../hooks/useT';
import { isInjection } from '../../utils/medForm';
import styles from './MedicationCard.module.css';

const STATUS_STYLES = {
  taken: { bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' },
  late: { bg: '#DC2626', color: '#fff', border: '#DC2626' },
  skipped: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
};

export default function MedicationCard({ medication }) {
  const times = Array.isArray(medication.times) ? medication.times.join(' & ') : medication.times;
  const { medicationStatus, setMedicationStatus } = useMedicationsStore();
  const status = medicationStatus[medication.id] || 'pending';
  const [showDetail, setShowDetail] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const t = useT();
  // Thuốc tiêm (insulin, GLP-1): nói "tiêm" thay cho "uống" để người lớn tuổi không nhầm
  const injection = isInjection(medication);
  const verb = injection ? 'tiêm' : 'uống';

  // Cập nhật giờ mỗi 30s để tự động mở khóa khi tới giờ uống
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Kiểm tra xem đã tới giờ uống chưa
  const timeEligibility = useMemo(() => {
    return checkMedicationTimeEligibility(medication, currentTime);
  }, [medication, currentTime]);

  const isRestDay = timeEligibility.isRestDay;
  const isTaken = !isRestDay && status === 'taken';
  const isSkipped = !isRestDay && status === 'skipped';
  const isLocked = !isRestDay && !isTaken && !isSkipped && !timeEligibility.isTimeArrived;
  const isLate = !isRestDay && !isTaken && !isSkipped && (status === 'late' || timeEligibility.isLate);

  // Huỷ thông báo nhắc lại (Lần 2, sau 15 phút) của cữ ĐANG được xác nhận (uống hoặc bỏ qua),
  // để máy không đổ chuông oan 15 phút sau khi bệnh nhân đã phản hồi rồi.
  const cancelActiveFollowup = () => {
    if (!timeEligibility.activeSlotTime) return;
    const instantIso = buildTodayInstant(timeEligibility.activeSlotTime, currentTime);
    if (instantIso) cancelFollowupReminder(instantIso);
  };

  const handleStatusToggle = () => {
    if (isRestDay) {
      setToastMsg(`📅 Hôm nay là ngày nghỉ cữ của ${medication.name}. Bác không cần uống hôm nay nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (isLocked) {
      const timeHint = timeEligibility.earliestUpcomingTime
        || (timeEligibility.startsTomorrowAt ? `ngày mai ${timeEligibility.startsTomorrowAt}` : 'sau');
      setToastMsg(`⏳ Chưa tới giờ ${verb} ${medication.name} (Lịch: ${timeHint}). Vui lòng ${verb} đúng giờ nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    const nextStatus = (isTaken || isSkipped) ? 'pending' : 'taken';
    setMedicationStatus(medication.id, nextStatus);
    recordMedicationIntake(medication, nextStatus, new Date(), null, timeEligibility.activeSlotTime);
    if (nextStatus === 'taken') cancelActiveFollowup();
  };

  const handleSkipConfirm = async (reason) => {
    setMedicationStatus(medication.id, 'skipped');
    recordMedicationIntake(medication, 'skipped', new Date(), reason, timeEligibility.activeSlotTime);
    cancelActiveFollowup();
    setShowSkipModal(false);
  };

  // Xác định text hiển thị trên nút
  let buttonLabel;
  if (isRestDay) {
    buttonLabel = '📅 Nghỉ cữ';
  } else if (isTaken) {
    buttonLabel = injection ? '✓ Đã tiêm' : `✓ ${t.medCard?.statusTaken || 'Đã uống'}`;
  } else if (isSkipped) {
    buttonLabel = '⏭ Đã bỏ qua';
  } else if (isLocked) {
    buttonLabel = timeEligibility.earliestUpcomingTime
      ? `${injection ? 'Tiêm' : 'Uống'} lúc ${timeEligibility.earliestUpcomingTime}`
      : timeEligibility.startsTomorrowAt
      ? `${injection ? 'Tiêm' : 'Uống'} từ mai lúc ${timeEligibility.startsTomorrowAt}`
      : `Chưa tới giờ ${verb}`;
  } else {
    buttonLabel = `✓ Tôi đã ${verb}`;
  }

  // Cho phép bấm "Bỏ qua cữ" khi cữ đã tới giờ, chưa được đánh dấu uống/bỏ qua rồi
  const canSkip = !isRestDay && !isTaken && !isSkipped && !isLocked;

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>{injection ? <Syringe size={22} /> : <Pill size={22} />}</div>
      <div className={styles.info}>
        <div className={styles.name}>{medication.name} {medication.dosage}</div>
        <div className={styles.frequency}>{medication.frequency}: {times}</div>
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {isLate && <div className={styles.lateNote}>Đã quá giờ {verb}</div>}
        {isRestDay && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 14, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              📅 Uống cách ngày • Hôm nay nghỉ cữ
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button className={styles.detailBtn} onClick={() => setShowDetail(true)}>
            {t.medCard?.details || 'Chi tiết'} <ChevronRight size={13} />
          </button>
          {canSkip && (
            <button className={styles.skipBtn} onClick={() => setShowSkipModal(true)}>
              <XCircle size={13} /> Bỏ qua cữ
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
            : isSkipped
            ? { background: STATUS_STYLES.skipped.bg, color: STATUS_STYLES.skipped.color, borderColor: STATUS_STYLES.skipped.border, cursor: 'pointer' }
            : isLate
            ? { background: STATUS_STYLES.late.bg, color: STATUS_STYLES.late.color, borderColor: STATUS_STYLES.late.border, cursor: 'pointer' }
            : { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)', cursor: 'pointer' }
        }
        title={
          isRestDay
            ? 'Hôm nay là ngày nghỉ cữ của thuốc này'
            : isLocked
            ? `Chưa tới giờ ${verb} (${timeEligibility.earliestUpcomingTime || ''}). Sẽ cho phép chọn khi tới giờ!`
            : isTaken
            ? 'Đã uống - Bấm để thay đổi'
            : isSkipped
            ? 'Đã bỏ qua cữ này - Bấm để thay đổi'
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
