import { Activity, Plus, AlertTriangle } from 'lucide-react';
import { METRIC_TYPES, getMetricStatus } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import styles from './MetricCard.module.css';

export function MetricCard({ type, metric }) {
  const t = useT();
  const meta = METRIC_TYPES[type] || {};
  const typeLabel = t.metrics?.types?.[type] || meta.label || type;
  const status = metric ? getMetricStatus(type, metric.value) : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>
        <span>{typeLabel}</span>
        <Activity size={14} color="#1B5FA6" />
      </div>
      <div className={styles.cardValueRow}>
        <span className={`${styles.cardValue} ${status ? styles[status] : ''}`}>
          {metric 
            ? (type === 'blood_pressure' && metric.value_diastolic != null 
                ? `${metric.value}/${metric.value_diastolic}` 
                : `${metric.value}`)
            : '—'}
        </span>
        {status === 'danger' && <AlertTriangle size={16} color="#EF4444" />}
      </div>
      <div className={styles.cardSub}>
        {metric ? (meta.unit || 'mmol/L') : t.common?.noData || 'No data'}
      </div>
    </div>
  );
}

export function AddMetricCard({ onClick }) {
  const t = useT();
  return (
    <div className={styles.addCard} onClick={onClick}>
      <div className={styles.addIcon}><Plus size={18} /></div>
      <span className={styles.addLabel}>{t.dashboard?.addMetric || 'Add metric'}</span>
    </div>
  );
}
