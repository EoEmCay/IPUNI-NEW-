import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { METRIC_TYPES } from '../../constants/metrics';
import { useMetrics } from '../../hooks/useMetrics';
import FilterPills from '../../components/common/FilterPills';
import BloodGlucoseChart from '../../components/metrics/BloodGlucoseChart';
import MetricHistoryItem from '../../components/metrics/MetricHistoryItem';
import AddMetricModal from '../../components/metrics/AddMetricModal';
import Button from '../../components/common/Button';
import styles from './MetricsPage.module.css';

const TYPE_OPTIONS = Object.entries(METRIC_TYPES).map(([k, v]) => ({ value: k, label: v.label }));

export default function MetricsPage() {
  const [activeType, setActiveType] = useState('fasting');
  const [days, setDays] = useState(7);
  const [showModal, setShowModal] = useState(false);
  const { metrics, loading, fetchMetrics, addMetric, removeMetric } = useMetrics();

  useEffect(() => {
    fetchMetrics(activeType, days);
  }, [activeType, days]);

  const handleSave = async (data) => {
    await addMetric(data);
    fetchMetrics(activeType, days);
  };

  const handleDelete = async (id) => {
    await removeMetric(id);
    fetchMetrics(activeType, days);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Theo dõi chỉ số</h1>
          <p className={styles.subtitle}>Nhập và xem biểu đồ chỉ số sức khỏe</p>
        </div>
        <Button onClick={() => setShowModal(true)} style={{ borderRadius: 20, padding: '8px 14px', fontSize: 13 }}>
          <Plus size={14} /> Nhập chỉ số
        </Button>
      </div>

      <div className={styles.tabsRow}>
        <FilterPills options={TYPE_OPTIONS} value={activeType} onChange={(v) => { setActiveType(v); setDays(7); }} />
      </div>

      <div className={styles.chartSection}>
        <BloodGlucoseChart data={metrics} type={activeType} days={days} onDaysChange={setDays} />
      </div>

      <div className={styles.historySection}>
        <div className={styles.historyTitle}>Lịch sử gần đây</div>
        {metrics.length === 0 ? (
          <div className={styles.emptyHistory}>
            Chưa có dữ liệu.<br />Nhấn "Nhập chỉ số" để bắt đầu theo dõi.
          </div>
        ) : (
          metrics.map((m) => (
            <MetricHistoryItem key={m.id} metric={m} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showModal && (
        <AddMetricModal
          defaultType={activeType}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
