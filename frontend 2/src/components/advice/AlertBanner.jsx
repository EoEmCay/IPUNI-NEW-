import { AlertTriangle, ChevronRight } from 'lucide-react';
import styles from './AlertBanner.module.css';

export default function AlertBanner({ onClick }) {
  return (
    <div className={styles.banner} onClick={onClick}>
      <AlertTriangle size={22} className={styles.icon} />
      <div className={styles.content}>
        <div className={styles.title}>⚠️ Dấu hiệu nguy hiểm cần biết</div>
        <div className={styles.sub}>Nhận biết và xử lý hạ/tăng đường huyết cấp</div>
      </div>
      <ChevronRight size={18} color="#DC2626" />
    </div>
  );
}
