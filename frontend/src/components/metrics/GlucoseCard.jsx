import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Plus, ChevronRight } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import useAuthStore from '../../store/authStore';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../../constants/metrics';
import { getGlucoseUnit, formatGlucose } from '../../utils/glucoseUnit';
import { saveGlucoseReading } from '../../utils/glucoseReading';
import { useT } from '../../hooks/useT';
import GlucoseQuickModal from './GlucoseQuickModal';
import styles from './GlucoseCard.module.css';

// Đường huyết bản gọn cho trang Hôm nay: số đo gần nhất + nút ghi nhanh. Biểu đồ & lịch sử ở /glucose.
export default function GlucoseCard() {
  const t = useT();
  const diagnosis = useAuthStore((s) => s.user?.diagnosis);
  const { metrics, fetchMetrics, addMetric } = useMetrics();
  const [open, setOpen] = useState(false);
  const unit = getGlucoseUnit();

  const load = () => fetchMetrics(undefined, 30);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = (metrics || []).find((m) => m.measurement_type?.startsWith('glucose'));
  const latestStatus = latest && getMetricStatus(latest.measurement_type, latest.value, diagnosis);

  const save = async (data) => { await saveGlucoseReading(addMetric, data, diagnosis); await load(); };

  return (
    <section className={styles.card} aria-labelledby="glucose-title">
      <div className={styles.head}>
        <h2 id="glucose-title" className={styles.title}><Droplet size={20} aria-hidden="true" /> Đường huyết</h2>
        <Link to="/glucose" className={styles.more}>Biểu đồ & lịch sử <ChevronRight size={18} aria-hidden="true" /></Link>
      </div>

      {latest ? (
        <div className={styles.latest}>
          <span className={styles.latestValue} style={{ color: STATUS_COLORS[latestStatus] }}>{formatGlucose(latest.value, unit)}</span>
          <span className={styles.latestUnit}>{unit}</span>
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

      {open && <GlucoseQuickModal onClose={() => setOpen(false)} onSave={save} />}
    </section>
  );
}
