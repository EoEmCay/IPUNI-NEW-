import { getMetricStatus, STATUS_COLORS } from '../../constants/metrics';
import { formatGlucose, MMOL_TO_MGDL } from '../../utils/glucoseUnit';
import styles from './GlucoseChart.module.css';

// Vùng an toàn theo đồng thuận quốc tế "Time in Range": 3.9–10 mmol/L (70–180 mg/dL)
const SAFE_LOW = 3.9;
const SAFE_HIGH = 10;
const W = 340, H = 230, PAD = { l: 44, r: 18, t: 28, b: 32 };

const pad2 = (n) => String(n).padStart(2, '0');
const dayLabel = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;

export default function GlucoseChart({ readings, unit, diagnosis }) {
  const pts = [...readings].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
  if (pts.length === 0) return <p className={styles.empty}>Chưa có số đo trong khoảng thời gian này.</p>;

  const k = unit === 'mg/dL' ? MMOL_TO_MGDL : 1;
  const vals = pts.map((p) => Number(p.value) * k);
  const lo = Math.min(...vals, SAFE_LOW * k) * 0.85;
  const hi = Math.max(...vals, SAFE_HIGH * k) * 1.1;
  const INSET = 16; // chấm đầu/cuối không dính vào trục
  const x = (i) => PAD.l + INSET + (pts.length === 1 ? (W - PAD.l - PAD.r) / 2 - INSET : (i * (W - PAD.l - PAD.r - 2 * INSET)) / (pts.length - 1));
  const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  // Chỉ ghi 2 mốc có ý nghĩa: mép dưới và mép trên của vùng an toàn
  const ticks = [SAFE_LOW * k, SAFE_HIGH * k];
  const labelEvery = Math.ceil(pts.length / 5); // tối đa ~5 nhãn ngày
  const showValues = pts.length <= 12;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img"
        aria-label={`Biểu đồ ${pts.length} lần đo đường huyết`}>
        <rect x={PAD.l} y={y(SAFE_HIGH * k)} width={W - PAD.l - PAD.r} height={y(SAFE_LOW * k) - y(SAFE_HIGH * k)} className={styles.safe} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className={styles.axis}>{unit === 'mg/dL' ? Math.round(t) : t.toFixed(1)}</text>
          </g>
        ))}
        <polyline points={pts.map((p, i) => `${x(i)},${y(vals[i])}`).join(' ')} className={styles.line} />
        {pts.map((p, i) => {
          const color = STATUS_COLORS[getMetricStatus(p.measurement_type, Number(p.value), diagnosis)];
          const last = i === pts.length - 1;
          return (
            <g key={p.id ?? i}>
              <circle cx={x(i)} cy={y(vals[i])} r={last ? 6 : 4.5} fill={color} stroke="var(--color-surface)" strokeWidth="2" />
              {(showValues || last) && (
                <text x={x(i)} y={y(vals[i]) - 10} textAnchor="middle" className={styles.value}>{formatGlucose(p.value, unit)}</text>
              )}
              {(i % labelEvery === 0 || last) && (
                <text x={x(i)} y={H - 8} textAnchor="middle" className={styles.axis}>{dayLabel(new Date(p.measured_at))}</text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className={styles.legend}>
        <li><span style={{ background: STATUS_COLORS.low }} />Thấp</li>
        <li><span style={{ background: STATUS_COLORS.normal }} />Đạt mục tiêu</li>
        <li><span style={{ background: STATUS_COLORS.above_target }} />Hơi cao</li>
        <li><span style={{ background: STATUS_COLORS.danger }} />Cao</li>
        <li className={styles.legendSafe}><span />Vùng an toàn {unit === 'mg/dL' ? '70–180' : '3.9–10'} {unit}</li>
      </ul>
    </div>
  );
}
