import { useEffect, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import { useT } from '../../hooks/useT';
import { METRIC_TYPES, getMetricStatus } from '../../constants/metrics';
import styles from './AverageMetricCard.module.css';

export function AverageMetricCard() {
  const t = useT();
  const [activeType, setActiveType] = useState('glucose_fasting');
  const { fetchMetrics, metrics } = useMetrics();

  useEffect(() => {
    fetchMetrics(activeType, 7);
  }, [activeType, fetchMetrics]);

  const averageValue = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;
    
    if (activeType === 'blood_pressure') {
      const sumSys = metrics.reduce((a, b) => a + (b.value || 0), 0);
      const sumDia = metrics.reduce((a, b) => a + (b.value_diastolic || 0), 0);
      return `${Math.round(sumSys / metrics.length)}/${Math.round(sumDia / metrics.length)}`;
    }
    
    const sum = metrics.reduce((a, b) => a + (b.value || 0), 0);
    // If all are integers and division is exact, we could show integer. 
    // toFixed(1) is standard for averages.
    return (sum / metrics.length).toFixed(1);
  }, [metrics, activeType]);

  const meta = METRIC_TYPES[activeType] || {};
  const status = averageValue && activeType !== 'blood_pressure' 
    ? getMetricStatus(activeType, parseFloat(averageValue)) 
    : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <select 
          className={styles.metricSelect}
          value={activeType}
          onChange={(e) => setActiveType(e.target.value)}
        >
          {Object.entries(t.metrics.types).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Activity size={16} color="#1B5FA6" />
      </div>
      
      <div className={styles.cardBody}>
        <div className={`${styles.cardValue} ${status ? styles[status] : ''}`}>
          {averageValue ? averageValue : '—'}
        </div>
        <div className={styles.cardUnit}>
          {averageValue ? (meta.unit || 'mmol/L') : t.common?.noData || 'No data'}
        </div>
      </div>
    </div>
  );
}
