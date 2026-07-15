import { useState } from 'react';
import { Pill, ChevronRight, CheckSquare, Square, CalendarPlus } from 'lucide-react';
import useMedicationsStore from '../../store/medicationsStore';
import { withDoctorPrefix } from '../../utils/doctor';
import MedicationDetailModal from './MedicationDetailModal';
import { useT } from '../../hooks/useT';
import { addMedicationsToCalendar } from '../../utils/calendar';
import styles from './MedicationCard.module.css';

const STATUS_STYLES = {
  pending: { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' },
  taken: { bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' },
  late: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
};

export default function MedicationCard({ medication, isSelectable = false, isSelected = false, onToggleSelect }) {
  const times = Array.isArray(medication.times) ? medication.times.join(' & ') : medication.times;
  const { medicationStatus, setMedicationStatus, medications } = useMedicationsStore();
  const status = medicationStatus[medication.id] || 'pending';
  const s = STATUS_STYLES[status];
  const [showDetail, setShowDetail] = useState(false);
  const t = useT();

  return (
    <div className={styles.card} onClick={isSelectable ? onToggleSelect : undefined} style={{ cursor: isSelectable ? 'pointer' : 'default' }}>
      {isSelectable && (
        <div className={styles.checkboxWrap}>
          {isSelected ? <CheckSquare size={20} color="#1B5FA6" /> : <Square size={20} color="#94A3B8" />}
        </div>
      )}
      <div className={styles.iconWrap}><Pill size={22} /></div>
      <div className={styles.info}>
        <div className={styles.name}>{medication.name} {medication.dosage}</div>
        <div className={styles.frequency}>{medication.frequency}: {times}</div>
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {medication.doctor_name && <div className={styles.doctor}>{withDoctorPrefix(medication.doctor_name)}</div>}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={styles.detailBtn} onClick={() => setShowDetail(true)}>
            {t.medCard?.details || 'Chi tiết'} <ChevronRight size={13} />
          </button>
          <button 
            className={styles.detailBtn} 
            onClick={(e) => { e.stopPropagation(); addMedicationsToCalendar(medications); }}
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Thêm tất cả thuốc vào lịch"
          >
            <CalendarPlus size={14} /> Thêm Lịch
          </button>
        </div>
      </div>

      {!isSelectable && (
        <button
          className={styles.statusSelect}
          onClick={(e) => { e.stopPropagation(); setMedicationStatus(medication.id, status === 'taken' ? 'pending' : 'taken'); }}
          style={{ background: s.bg, color: s.color, borderColor: s.border, cursor: 'pointer' }}
        >
          {status === 'taken' ? (t.medCard?.statusTaken || 'Đã uống') : status === 'late' ? (t.medCard?.statusLate || 'Quá giờ') : (t.medCard?.statusPending || 'Chưa uống')}
        </button>
      )}

      {showDetail && (
        <MedicationDetailModal medication={medication} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}
