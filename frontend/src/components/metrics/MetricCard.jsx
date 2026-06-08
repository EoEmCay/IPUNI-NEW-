import { Activity, Plus } from 'lucide-react';
import { METRIC_TYPES, getMetricStatus } from '../../constants/metrics';
import styles from './MetricCard.module.css';

export function MetricCard({ type, metric }) {
  const meta = METRIC_TYPES[type];
  const status = metric ? getMetricStatus(type, metric.value) : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>
        <span>{meta?.label || 'Đường huyết'}</span>
        <Activity size={14} color="#1B5FA6" />
      </div>
      <div className={`${styles.cardValue} ${status ? styles[status] : ''}`}>
        {metric ? `${metric.value}` : '—'}
      </div>
      <div className={styles.cardSub}>
        {metric ? 'mmol/L' : 'Chưa đo'}
      </div>
    </div>
  );
}

export function AddMetricCard({ onClick }) {
  return (
    <div className={styles.addCard} onClick={onClick}>
      <div className={styles.addIcon}><Plus size={18} /></div>
      <span className={styles.addLabel}>Nhập chỉ số</span>
    </div>
  );
}
