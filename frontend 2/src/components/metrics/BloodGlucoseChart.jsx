import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { METRIC_TYPES } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import styles from './BloodGlucoseChart.module.css';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()}/${d.getMonth() + 1} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BloodGlucoseChart({ data = [], type, days, onDaysChange }) {
  const t = useT();
  const meta = METRIC_TYPES[type] || METRIC_TYPES.glucose_fasting;
  const unit = meta.unit || 'mmol/L';

  // Sort by exact timestamp ascending -> earliest entered shows first
  const chartData = [...data]
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    .map((m) => ({ date: formatTime(m.measured_at), value: m.value }));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{t.metrics?.types?.[type] || meta.label}</span>
        <select className={styles.daysSelect} value={days} onChange={(e) => onDaysChange(Number(e.target.value))}>
          <option value={7}>{t.metrics?.days7 || '7 ngày'}</option>
          <option value={14}>{t.metrics?.days14 || '14 ngày'}</option>
          <option value={30}>{t.metrics?.days30 || '30 ngày'}</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.empty}>{t.metrics?.noData || 'Chưa có dữ liệu.'}</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7A8D' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7A8D' }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              formatter={(v) => [`${v} ${unit}`, meta.label]}
            />
            {meta.prediabetesMin != null && (
              <ReferenceLine y={meta.prediabetesMin} stroke="#F59E0B" strokeDasharray="4 2" />
            )}
            {meta.dangerMin != null && (
              <ReferenceLine y={meta.dangerMin} stroke="#EF4444" strokeDasharray="4 2" />
            )}
            <Line type="monotone" dataKey="value" stroke="#1B5FA6" strokeWidth={2.5} dot={{ r: 4, fill: '#1B5FA6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className={styles.legend}>
        {meta.prediabetesMin != null && (
          <div className={styles.legendItem}>
            <div className={styles.legendDash} style={{ background: '#F59E0B' }} />
            <span>{t.metrics?.statusPrediabetes || 'Tiền đái tháo đường'}: ≥{meta.prediabetesMin} {unit}</span>
          </div>
        )}
        {meta.dangerMin != null && (
          <div className={styles.legendItem}>
            <div className={styles.legendDash} style={{ background: '#EF4444' }} />
            <span>{t.metrics?.statusDanger || 'Đái tháo đường'}: ≥{meta.dangerMin} {unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}
