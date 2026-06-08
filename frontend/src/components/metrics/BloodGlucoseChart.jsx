import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';
import { METRIC_TYPES } from '../../constants/metrics';
import styles from './BloodGlucoseChart.module.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function BloodGlucoseChart({ data, type, days, onDaysChange }) {
  const meta = METRIC_TYPES[type] || METRIC_TYPES.fasting;

  const chartData = [...data]
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    .map((m) => ({ date: formatDate(m.measured_at), value: m.value }));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{meta.label}</span>
        <select className={styles.daysSelect} value={days} onChange={(e) => onDaysChange(Number(e.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.empty}>Chưa có dữ liệu.<br />Nhấn "Nhập chỉ số" để bắt đầu.</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7A8D' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7A8D' }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              formatter={(v) => [`${v} mmol/L`, 'Đường huyết']}
            />
            <ReferenceLine y={meta.normalMax} stroke="#22C55E" strokeDasharray="4 2" />
            <ReferenceLine y={meta.dangerMin} stroke="#EF4444" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="value" stroke="#1B5FA6" strokeWidth={2.5} dot={{ r: 4, fill: '#1B5FA6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDash} style={{ background: '#22C55E' }} />
          <span>Bình thường: {meta.normal}</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDash} style={{ background: '#EF4444' }} />
          <span>Nguy hiểm: {meta.danger}</span>
        </div>
      </div>
    </div>
  );
}
