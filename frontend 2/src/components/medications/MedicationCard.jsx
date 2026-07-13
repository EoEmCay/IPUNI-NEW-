import { useState } from 'react';
import { Pill, ChevronRight } from 'lucide-react';
import useMedicationsStore from '../../store/medicationsStore';
import { withDoctorPrefix } from '../../utils/doctor';
import MedicationDetailModal from './MedicationDetailModal';
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
  const s = STATUS_STYLES[status];
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}><Pill size={22} /></div>
      <div className={styles.info}>
        <div className={styles.name}>{medication.name} {medication.dosage}</div>
        <div className={styles.frequency}>{medication.frequency}: {times}</div>
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {medication.doctor_name && <div className={styles.doctor}>{withDoctorPrefix(medication.doctor_name)}</div>}

        <button className={styles.detailBtn} onClick={() => setShowDetail(true)}>
          Chi tiết <ChevronRight size={13} />
        </button>
      </div>

      <button
        className={styles.statusSelect}
        onClick={() => setMedicationStatus(medication.id, status === 'taken' ? 'pending' : 'taken')}
        style={{ background: s.bg, color: s.color, borderColor: s.border, cursor: 'pointer' }}
      >
        {status === 'taken' ? 'Đã uống' : status === 'late' ? 'Quá giờ' : 'Chưa uống'}
      </button>

      {showDetail && (
        <MedicationDetailModal medication={medication} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}
