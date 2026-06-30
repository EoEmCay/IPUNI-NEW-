import { Activity, Droplet } from 'lucide-react';
import { useT } from '../../hooks/useT';
import styles from './StatisticsCard.module.css';

export default function StatisticsCard({ statistics, estimatedHbA1c, period, type }) {
  const t = useT();

  if (!statistics || statistics.count === 0) {
    return null;
  }

  const typeLabel = t.metrics?.types?.[type] || type;
  const getTitle = () => `${t.metrics?.statisticsTitle || 'Thống kê'} ${typeLabel}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{getTitle()} (90 ngày)</h3>
        <Activity size={16} className={styles.icon} />
      </div>

      <div className={styles.grid}>
        <div className={styles.statItem}>
          <span className={styles.label}>Trung bình</span>
          <span className={styles.value}>{statistics.average}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>Biến thiên (SD)</span>
          <span className={styles.value}>{statistics.stdDev}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>Cao nhất</span>
          <span className={styles.value}>{statistics.maximum}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>Thấp nhất</span>
          <span className={styles.value}>{statistics.minimum}</span>
        </div>
      </div>

      {estimatedHbA1c != null && type.includes('glucose') && (
        <div className={styles.hba1cRow}>
          <div className={styles.hba1cIcon}><Droplet size={14} color="#EF4444" /></div>
          <div className={styles.hba1cText}>
            <span className={styles.hba1cLabel}>HbA1c ước lượng (90 ngày):</span>
            <span className={styles.hba1cValue}>{estimatedHbA1c}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
