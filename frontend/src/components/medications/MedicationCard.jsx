import { useState, useMemo, useEffect } from 'react';
import { Pill, ChevronRight } from 'lucide-react';
import useMedicationsStore from '../../store/medicationsStore';
import { recordMedicationIntake } from '../../store/medicationAdherenceStore';
import MedicationDetailModal from './MedicationDetailModal';
import { checkMedicationTimeEligibility } from '../../utils/medicationTime';
import { useT } from '../../hooks/useT';
import styles from './MedicationCard.module.css';

const STATUS_STYLES = {
  pending: { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' },
  taken: { bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' },
  late: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
};

export default function MedicationCard({ medication }) {
  const times = Array.isArray(medication.times) ? medication.times.join(' & ') : medication.times;
  const { medicationStatus, setMedicationStatus } = useMedicationsStore();
  const status = medicationStatus[medication.id] || 'pending';
  const [showDetail, setShowDetail] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const t = useT();

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
  const isLocked = !isRestDay && !isTaken && !timeEligibility.isTimeArrived;
  const isLate = !isRestDay && !isTaken && (status === 'late' || timeEligibility.isLate);

  const handleStatusToggle = () => {
    if (isRestDay) {
      setToastMsg(`📅 Hôm nay là ngày nghỉ cữ của ${medication.name}. Bác không cần uống hôm nay nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (isLocked) {
      const timeHint = timeEligibility.earliestUpcomingTime || 'sau';
      setToastMsg(`⏳ Chưa tới giờ uống ${medication.name} (Lịch: ${timeHint}). Vui lòng uống đúng giờ nhé!`);
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    const nextStatus = isTaken ? 'pending' : 'taken';
    setMedicationStatus(medication.id, nextStatus);
    recordMedicationIntake(medication, nextStatus);
  };

  // Xác định text hiển thị trên nút
  let buttonLabel;
  if (isRestDay) {
    buttonLabel = '📅 Nghỉ cữ';
  } else if (isTaken) {
    buttonLabel = `✓ ${t.medCard?.statusTaken || 'Đã uống'}`;
  } else if (isLocked) {
    buttonLabel = timeEligibility.earliestUpcomingTime 
      ? `⏳ ${timeEligibility.earliestUpcomingTime}` 
      : `⏳ Chưa tới giờ`;
  } else if (isLate) {
    buttonLabel = t.medCard?.statusLate || 'Quá giờ';
  } else {
    buttonLabel = t.medCard?.statusPending || 'Chưa uống';
  }

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}><Pill size={22} /></div>
      <div className={styles.info}>
        <div className={styles.name}>{medication.name} {medication.dosage}</div>
        <div className={styles.frequency}>{medication.frequency}: {times}</div>
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {isRestDay && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              📅 Uống cách ngày • Hôm nay nghỉ cữ
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button className={styles.detailBtn} onClick={() => setShowDetail(true)}>
            {t.medCard?.details || 'Chi tiết'} <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <button
        className={`${styles.statusSelect} ${isLocked ? styles.statusSelectLocked : ''}`}
        onClick={handleStatusToggle}
        style={
          isRestDay
            ? { background: '#F3F4F6', color: '#9CA3AF', borderColor: '#E5E7EB', cursor: 'pointer' }
            : isLocked
            ? {}
            : isTaken
            ? { background: STATUS_STYLES.taken.bg, color: STATUS_STYLES.taken.color, borderColor: STATUS_STYLES.taken.border, cursor: 'pointer' }
            : isLate
            ? { background: STATUS_STYLES.late.bg, color: STATUS_STYLES.late.color, borderColor: STATUS_STYLES.late.border, cursor: 'pointer' }
            : { background: STATUS_STYLES.pending.bg, color: STATUS_STYLES.pending.color, borderColor: STATUS_STYLES.pending.border, cursor: 'pointer' }
        }
        title={
          isRestDay
            ? 'Hôm nay là ngày nghỉ cữ của thuốc này'
            : isLocked
            ? `Chưa tới giờ uống (${timeEligibility.earliestUpcomingTime || ''}). Sẽ cho phép chọn khi tới giờ!`
            : isTaken
            ? 'Đã uống - Bấm để thay đổi'
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
    </div>
  );
}
