import { Pill } from 'lucide-react';
import styles from './MedicationCard.module.css';

export default function MedicationCard({ medication }) {
  const times = Array.isArray(medication.times) ? medication.times.join(' & ') : medication.times;

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}><Pill size={22} /></div>
      <div className={styles.info}>
        <div className={styles.name}>{medication.name} {medication.dosage}</div>
        <div className={styles.frequency}>{medication.frequency}: {times}</div>
        {medication.instructions && <div className={styles.instructions}>{medication.instructions}</div>}
        {medication.doctor_name && <div className={styles.doctor}>Dr. {medication.doctor_name}</div>}
      </div>
      <button className={styles.takenBtn}>✓ Đã uống</button>
    </div>
  );
}
