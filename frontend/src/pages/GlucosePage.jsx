import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplet, Plus } from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import useAuthStore from '../store/authStore';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../constants/metrics';
import { getGlucoseUnit, setGlucoseUnit, formatGlucose } from '../utils/glucoseUnit';
import { saveGlucoseReading } from '../utils/glucoseReading';
import { useT } from '../hooks/useT';
import GlucoseChart from '../components/metrics/GlucoseChart';
import GlucoseQuickModal from '../components/metrics/GlucoseQuickModal';
import MetricHistoryItem from '../components/metrics/MetricHistoryItem';
import ExportReportButton from '../components/reports/ExportReportButton';
import styles from './GlucosePage.module.css';

const RANGES = [7, 30, 90];

// "Số đo đường huyết": biểu đồ + lịch sử đo. Mở từ thẻ đường huyết ở trang Hôm nay.
export default function GlucosePage() {
  const navigate = useNavigate();
  const t = useT();
  const diagnosis = useAuthStore((s) => s.user?.diagnosis);
  const { metrics, fetchMetrics, addMetric, removeMetric } = useMetrics();
  const [tab, setTab] = useState('chart');
  const [days, setDays] = useState(30);
  const [unit, setUnit] = useState(getGlucoseUnit);
  const [open, setOpen] = useState(false);

  const load = () => fetchMetrics(undefined, days);
  useEffect(() => { load(); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const readings = (metrics || []).filter((m) => m.measurement_type?.startsWith('glucose'));
  const latest = readings[0];
  const latestStatus = latest && getMetricStatus(latest.measurement_type, latest.value, diagnosis);

  const changeUnit = (u) => { setUnit(u); setGlucoseUnit(u); };
  const save = async (data) => { await saveGlucoseReading(addMetric, data, diagnosis); await load(); };
  const remove = async (id) => {
    if (!window.confirm(t.metrics.deleteConfirm)) return;
    await removeMetric(id);
    load();
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="Quay lại">
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.title}>Số đo đường huyết</h1>
      </div>

      <div className={styles.tabs} role="tablist">
        {[['chart', 'Biểu đồ'], ['history', 'Lịch sử đo']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.ranges} role="group" aria-label="Khoảng thời gian">
        {RANGES.map((d) => (
          <button key={d} type="button" aria-pressed={days === d}
            className={`${styles.range} ${days === d ? styles.rangeActive : ''}`} onClick={() => setDays(d)}>
            {d} ngày
          </button>
        ))}
      </div>

      <section className={styles.card}>
        <p className={styles.cardLabel}><Droplet size={18} aria-hidden="true" /> Số đo gần nhất</p>
        {latest ? (
          <div className={styles.latest}>
            <span className={styles.latestValue} style={{ color: STATUS_COLORS[latestStatus] }}>{formatGlucose(latest.value, unit)}</span>
            <span className={styles.latestUnit}>{unit}</span>
            <span className={styles.latestStatus} style={{ color: STATUS_COLORS[latestStatus] }}>
              {getStatusLabel(latestStatus, t, latest.measurement_type)}
            </span>
          </div>
        ) : (
          <p className={styles.empty}>Chưa có số đo.</p>
        )}
      </section>

      {tab === 'chart' ? (
        <section className={styles.card}>
          <div className={styles.units} role="group" aria-label="Đơn vị">
            {['mmol/L', 'mg/dL'].map((u) => (
              <button key={u} type="button" aria-pressed={unit === u}
                className={`${styles.unit} ${unit === u ? styles.unitActive : ''}`} onClick={() => changeUnit(u)}>
                {u}
              </button>
            ))}
          </div>
          <GlucoseChart readings={readings} unit={unit} diagnosis={diagnosis} />
        </section>
      ) : (
        <section className={styles.card}>
          {readings.length === 0
            ? <p className={styles.empty}>Chưa có số đo trong {days} ngày qua.</p>
            : readings.map((m) => <MetricHistoryItem key={m.id} metric={m} onDelete={remove} unit={unit} />)}
          <ExportReportButton days={days} />
        </section>
      )}

      <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Ghi đường huyết">
        <Plus size={30} />
      </button>
      {open && <GlucoseQuickModal onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}
