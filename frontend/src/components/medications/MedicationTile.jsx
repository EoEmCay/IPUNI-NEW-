import { Pill, Syringe } from 'lucide-react';
import { isInjection } from '../../utils/medForm';
import styles from './MedicationTile.module.css';

// Ô vuông cho 1 thuốc: icon theo dạng thuốc (viên / tiêm), tên bên dưới. Bấm để xem chi tiết.
export default function MedicationTile({ medication, onClick, badge }) {
  const injection = isInjection(medication);
  const Icon = injection ? Syringe : Pill;
  return (
    <button type="button" className={styles.tile} onClick={onClick}
      aria-label={`${medication.name}${injection ? ' (thuốc tiêm)' : ''} - xem chi tiết`}>
      <span className={`${styles.icon} ${injection ? styles.iconInjection : ''}`}>
        <Icon size={34} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={styles.name}>{medication.name}</span>
      {medication.dosage && <span className={styles.dosage}>{medication.dosage}</span>}
      {badge && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}

export function MedicationGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}
