import { useEffect, useState } from 'react';
import { Droplet, Plus, ChevronRight, LineChart, ArrowDown, ArrowUp, Minus } from 'lucide-react';
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
import PageHeader from '../components/common/PageHeader';

const RANGES = [7, 30, 90];
const DAY_MS = 86400000;
const pad2 = (n) => String(n).padStart(2, '0');
const mean = (arr) => (arr.length ? arr.reduce((sum, m) => sum + Number(m.value), 0) / arr.length : null);

// "Hôm nay · 08:30 · 30 phút trước"
function whenText(iso, now) {
  const d = new Date(iso);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const day = d >= startOfToday ? 'Hôm nay'
    : d >= startOfToday - DAY_MS ? 'Hôm qua'
      : `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  const mins = Math.max(0, Math.round((now - d) / 60000));
  const ago = mins < 1 ? 'vừa xong'
    : mins < 60 ? `${mins} phút trước`
      : mins < 1440 ? `${Math.floor(mins / 60)} giờ trước`
        : `${Math.floor(mins / 1440)} ngày trước`;
  return `${day} · ${pad2(d.getHours())}:${pad2(d.getMinutes())} · ${ago}`;
}

// "Số đo đường huyết": biểu đồ + lịch sử đo. Mở từ thẻ đường huyết ở trang Hôm nay.
export default function GlucosePage() {
  const t = useT();
  const diagnosis = useAuthStore((s) => s.user?.diagnosis);
  const { metrics, fetchMetrics, addMetric, removeMetric } = useMetrics();
  const [tab, setTab] = useState('chart');
  const [days, setDays] = useState(30);
  const [unit, setUnit] = useState(getGlucoseUnit);
  const [open, setOpen] = useState(false);

  // Lấy gấp đôi số ngày: nửa sau để so sánh trung bình với kỳ trước (vd 30 ngày trước đó)
  const [now, setNow] = useState(() => Date.now()); // mốc tính "N ngày qua", cập nhật mỗi lần tải
  const load = () => { setNow(Date.now()); return fetchMetrics(undefined, days * 2); };
  useEffect(() => { load(); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const cutoff = now - days * DAY_MS;
  const allGlucose = (metrics || []).filter((m) => m.measurement_type?.startsWith('glucose'));
  const readings = allGlucose.filter((m) => new Date(m.measured_at) >= cutoff);
  const avg = mean(readings);
  const prevAvg = mean(allGlucose.filter((m) => new Date(m.measured_at) < cutoff));
  const diff = avg != null && prevAvg != null ? avg - prevAvg : null;
  const latest = allGlucose[0];
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
      <PageHeader title="Số đo đường huyết" />

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

      <button type="button" className={`${styles.card} ${styles.latestCard}`} onClick={() => setTab('history')}
        aria-label="Số đo gần nhất, bấm để xem lịch sử đo">
        <span className={styles.latestBody}>
          <span className={styles.cardLabel}><Droplet size={18} aria-hidden="true" /> Số đo gần nhất</span>
          {latest ? (
            <>
              <span className={styles.when}>{whenText(latest.measured_at, now)}</span>
              <span className={styles.latest}>
                <span className={styles.latestValue}>{formatGlucose(latest.value, unit)}</span>
                <span className={styles.latestUnit}>{unit}</span>
                <span className={styles.statusChip} style={{ color: STATUS_COLORS[latestStatus], background: `color-mix(in srgb, ${STATUS_COLORS[latestStatus]} 12%, white)` }}>
                  {getStatusLabel(latestStatus, t, latest.measurement_type)}
                </span>
              </span>
            </>
          ) : (
            <span className={styles.empty}>Chưa có số đo.</span>
          )}
        </span>
        <ChevronRight size={24} className={styles.chev} aria-hidden="true" />
      </button>

      {tab === 'chart' ? (
        <section className={styles.card}>
          <div className={styles.chartHead}>
            <h2 className={styles.chartTitle}><LineChart size={20} aria-hidden="true" /> Biểu đồ đường huyết</h2>
          <div className={styles.units} role="group" aria-label="Đơn vị">
            {['mmol/L', 'mg/dL'].map((u) => (
              <button key={u} type="button" aria-pressed={unit === u}
                className={`${styles.unit} ${unit === u ? styles.unitActive : ''}`} onClick={() => changeUnit(u)}>
                {u}
              </button>
            ))}
          </div>
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

      <section className={`${styles.card} ${styles.avgCard}`}>
        <span className={styles.avgIcon}><Droplet size={26} aria-hidden="true" /></span>
        <div className={styles.avgBody}>
          <p className={styles.avgLabel}>Chỉ số trung bình <span>({days} ngày)</span></p>
          {avg != null ? (
            <p className={styles.avgValue}>{formatGlucose(avg, unit)} <small>{unit}</small></p>
          ) : (
            <p className={styles.empty}>Chưa có số đo.</p>
          )}
        </div>
        {diff != null && (
          <div className={styles.diff}>
            <span className={styles.diffMain}>
              {Math.abs(diff) < 0.05
                ? <><Minus size={16} aria-hidden="true" /> Không đổi</>
                : <>{diff < 0 ? <ArrowDown size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />} {diff < 0 ? 'Giảm' : 'Tăng'} {unit === 'mmol/L' ? Math.abs(diff).toFixed(1) : formatGlucose(Math.abs(diff), unit)}</>}
            </span>
            <span className={styles.diffSub}>so với {days} ngày trước</span>
          </div>
        )}
      </section>

      <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Ghi đường huyết">
        <Plus size={30} />
      </button>
      {open && <GlucoseQuickModal onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}
