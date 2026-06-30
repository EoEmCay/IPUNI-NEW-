import { Activity } from 'lucide-react';
import { getMetricStatus } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import styles from './HbA1cCard.module.css';

export default function HbA1cCard({ reading }) {
  const t = useT();

  if (!reading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardLabel}>
          <span>{t.metrics?.types?.hba1c || 'HbA1c'}</span>
          <Activity size={14} color="var(--color-primary)" />
        </div>
        <div className={styles.cardValue}>—</div>
        <div className={styles.cardSub}>{t.common?.noData || 'No data'}</div>
      </div>
    );
  }

  const status = getMetricStatus('hba1c', reading.value);
  const statusClass = styles[status] || '';

  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>
        <span>{t.metrics?.types?.hba1c || 'HbA1c'}</span>
        <Activity size={14} color="var(--color-primary)" />
      </div>
      <div className={`${styles.cardValue} ${statusClass}`}>
        {reading.value}%
      </div>
      <div className={styles.cardSub}>
        {new Date(reading.measured_at).toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric'
        })}
      </div>
    </div>
  );
}
