import { useEffect, useState } from 'react';
import { Droplet, Plus } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import useAuthStore from '../../store/authStore';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../../constants/metrics';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { useT } from '../../hooks/useT';
import MetricHistoryItem from './MetricHistoryItem';
import GlucoseQuickModal from './GlucoseQuickModal';
import ExportReportButton from '../reports/ExportReportButton';
import styles from './GlucoseCard.module.css';

const RECENT_COUNT = 7;

// Đường huyết bản gọn cho trang Hôm nay: số đo gần nhất + nút ghi nhanh + 7 lần gần nhất.
export default function GlucoseCard() {
  const t = useT();
  const diagnosis = useAuthStore((s) => s.user?.diagnosis);
  const { metrics, fetchMetrics, addMetric, removeMetric } = useMetrics();
  const [open, setOpen] = useState(false);

  const load = () => fetchMetrics(undefined, 30);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = (metrics || [])
    .filter((m) => m.measurement_type?.startsWith('glucose'))
    .slice(0, RECENT_COUNT);
  const latest = recent[0];
  const latestStatus = latest && getMetricStatus(latest.measurement_type, latest.value, diagnosis);

  const save = async (data) => {
    await addMetric(data);
    await load();
    // Giọng nhắc khi đường huyết cao/thấp nguy hiểm (có thể là giọng người thân đã ghi âm)
    const status = getMetricStatus(data.measurement_type, data.value, diagnosis);
    if (status === 'danger') voiceAlertService.playAlert(ALERT_TYPES.SUGAR_HIGH);
    if (status === 'low') voiceAlertService.playAlert(ALERT_TYPES.SUGAR_LOW);
  };

  const remove = async (id) => {
    if (!window.confirm(t.metrics.deleteConfirm)) return;
    await removeMetric(id);
    load();
  };

  return (
    <section className={styles.card} aria-labelledby="glucose-title">
      <div className={styles.head}>
        <h2 id="glucose-title" className={styles.title}><Droplet size={20} aria-hidden="true" /> Đường huyết</h2>
      </div>

      {latest ? (
        <div className={styles.latest}>
          <span className={styles.latestValue} style={{ color: STATUS_COLORS[latestStatus] }}>{latest.value}</span>
          <span className={styles.latestUnit}>mmol/L</span>
          <span className={styles.latestStatus} style={{ color: STATUS_COLORS[latestStatus] }}>
            {getStatusLabel(latestStatus, t, latest.measurement_type)}
          </span>
        </div>
      ) : (
        <p className={styles.empty}>Chưa có số đo nào.</p>
      )}

      <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
        <Plus size={22} aria-hidden="true" /> Ghi đường huyết
      </button>

      {recent.length > 0 && (
        <div className={styles.recent}>
          <p className={styles.recentTitle}>{recent.length} lần đo gần nhất</p>
          {recent.map((m) => <MetricHistoryItem key={m.id} metric={m} onDelete={remove} />)}
          <ExportReportButton days={30} />
        </div>
      )}

      {open && <GlucoseQuickModal onClose={() => setOpen(false)} onSave={save} />}
    </section>
  );
}
