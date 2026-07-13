import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import { useT } from '../../hooks/useT';
import FilterPills from '../../components/common/FilterPills';
import BloodGlucoseChart from '../../components/metrics/BloodGlucoseChart';
import MetricHistoryItem from '../../components/metrics/MetricHistoryItem';
import AddMetricModal from '../../components/metrics/AddMetricModal';
import StatisticsCard from '../../components/metrics/StatisticsCard';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { getMetricStatus } from '../../constants/metrics';
import Button from '../../components/common/Button';
import styles from './MetricsPage.module.css';

export default function MetricsPage() {
  const [activeType, setActiveType] = useState('glucose_fasting');
  const [days, setDays] = useState(7);
  const [showModal, setShowModal] = useState(false);
  const { metrics, statistics, loading, fetchMetrics, fetchStatistics, addMetric, removeMetric } = useMetrics();
  const t = useT();

  const TYPE_OPTIONS = Object.entries(t.metrics.types).map(([k, v]) => ({ value: k, label: v }));

  useEffect(() => {
    fetchMetrics(activeType, days);
    fetchStatistics(activeType, 90); // Always fetch 90 days for statistics
  }, [activeType, days, fetchMetrics, fetchStatistics]);

  const handleSave = async (data) => {
    await addMetric(data);
    fetchMetrics(activeType, days);

    // Kiểm tra để kích hoạt voice alert
    const status = getMetricStatus(data.measurement_type, data.value);
    
    if (data.measurement_type.includes('glucose')) {
      if (status === 'danger' || status === 'low') {
        voiceAlertService.playAlert(
          status === 'danger' ? ALERT_TYPES.SUGAR_HIGH : ALERT_TYPES.SUGAR_LOW
        );
      }
    } else if (data.measurement_type === 'blood_pressure') {
      if (status === 'low') {
        // Low blood pressure
        voiceAlertService.playAlert(ALERT_TYPES.BP_LOW);
      }
    }
  };

  const handleDelete = async (id) => {
    await removeMetric(id);
    fetchMetrics(activeType, days);
  };

  return (
    <div className={`${styles.page} tour-step-4`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{t.metrics.title}</h1>
          <p className={styles.subtitle}>{t.metrics.subtitle}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className={styles.addBtn}>
          <Plus size={14} /> {t.metrics.addBtn}
        </Button>
      </div>

      <div className={styles.tabsRow}>
        <FilterPills options={TYPE_OPTIONS} value={activeType} onChange={(v) => { setActiveType(v); setDays(7); }} />
      </div>

      <div className={styles.chartSection}>
        <BloodGlucoseChart data={metrics} type={activeType} days={days} onDaysChange={setDays} />
      </div>
      
      <div className={styles.statsSection}>
        <StatisticsCard 
          statistics={statistics?.statistics} 
          estimatedHbA1c={statistics?.estimatedHbA1c} 
          period={statistics?.period || '90 days'} 
          type={activeType} 
        />
      </div>

      <div className={styles.historySection}>
        {loading ? null : metrics.length === 0 ? (
          <p className={styles.empty}>{t.metrics.noData}</p>
        ) : (
          metrics.map((m) => <MetricHistoryItem key={m.id} metric={m} onDelete={handleDelete} />)
        )}
      </div>

      {showModal && (
        <AddMetricModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          defaultType={activeType}
        />
      )}
    </div>
  );
}
