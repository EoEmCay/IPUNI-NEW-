import { useId } from 'react';
import { getMetricStatus, STATUS_COLORS } from '../../constants/metrics';
import { formatGlucose, MMOL_TO_MGDL } from '../../utils/glucoseUnit';
import { monotonePath, niceStep } from '../../utils/chartPath';
import styles from './GlucoseChart.module.css';

// Vùng an toàn theo đồng thuận quốc tế "Time in Range": 3.9–10 mmol/L (70–180 mg/dL)
const SAFE_LOW = 3.9;
const SAFE_HIGH = 10;
const W = 340, H = 250, PAD = { l: 46, r: 20, t: 34, b: 48 };

const pad2 = (n) => String(n).padStart(2, '0');

export default function GlucoseChart({ readings, unit, diagnosis }) {
  const gradId = useId();
  const pts = [...readings].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
  if (pts.length === 0) return <p className={styles.empty}>Chưa có số đo trong khoảng thời gian này.</p>;

  const k = unit === 'mg/dL' ? MMOL_TO_MGDL : 1;
  const vals = pts.map((p) => Number(p.value) * k);

  // Trục Y bắt đầu từ 0, mốc tròn đều (0/100/200/300 mg/dL hoặc 0/5/10/15 mmol/L)
  const top = Math.max(...vals, SAFE_HIGH * k) * 1.15;
  const step = niceStep(top, unit === 'mg/dL' ? 3 : 3);
  const hi = Math.ceil(top / step) * step;
  const yTicks = Array.from({ length: Math.round(hi / step) + 1 }, (_, i) => i * step);

  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const INSET = 14; // chấm đầu/cuối không dính vào trục
  const x = (i) => PAD.l + INSET + (pts.length === 1 ? plotW / 2 - INSET : (i * (plotW - 2 * INSET)) / (pts.length - 1));
  const y = (v) => PAD.t + (1 - v / hi) * plotH;
  const xy = pts.map((p, i) => ({ x: +x(i).toFixed(1), y: +y(vals[i]).toFixed(1) }));
  const line = monotonePath(xy);
  const area = pts.length > 1 ? `${line} L${xy[xy.length - 1].x},${PAD.t + plotH} L${xy[0].x},${PAD.t + plotH} Z` : null;

  const labelEvery = Math.ceil(pts.length / 4); // tối đa ~4 nhãn giờ/ngày trên trục X
  const showValues = pts.length <= 12;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img"
        aria-label={`Biểu đồ ${pts.length} lần đo đường huyết, đơn vị ${unit}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x={PAD.l} y={y(SAFE_HIGH * k)} width={plotW} height={y(SAFE_LOW * k) - y(SAFE_HIGH * k)} className={styles.safe} />

        {/* Trục Y: đơn vị + mốc chia */}
        <text x={PAD.l - 8} y={PAD.t - 16} textAnchor="end" className={styles.axisTitle}>{unit}</text>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.l - 8} y={y(t) + 5} textAnchor="end" className={styles.axis}>{unit === 'mg/dL' ? t : t.toFixed(0)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PAD.t + plotH} className={styles.axisLine} />
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + plotH} y2={PAD.t + plotH} className={styles.axisLine} />

        {area && <path d={area} fill={`url(#${gradId})`} />}
        <path d={line} className={styles.line} />

        {pts.map((p, i) => {
          const color = STATUS_COLORS[getMetricStatus(p.measurement_type, Number(p.value), diagnosis)];
          const last = i === pts.length - 1;
          const d = new Date(p.measured_at);
          return (
            <g key={p.id ?? i}>
              <circle cx={xy[i].x} cy={xy[i].y} r={last ? 6 : 4.5} fill={color} stroke="var(--color-surface)" strokeWidth="2" />
              {(showValues || last) && (
                <text x={xy[i].x} y={xy[i].y - 11} textAnchor="middle" className={styles.value}>{formatGlucose(p.value, unit)}</text>
              )}
              {/* Trục X: giờ đo + ngày đo */}
              {((i % labelEvery === 0 && pts.length - 1 - i >= labelEvery) || last) && (
                <text x={xy[i].x} y={PAD.t + plotH + 20} textAnchor="middle" className={styles.axis}>
                  <tspan x={xy[i].x}>{`${pad2(d.getHours())}:${pad2(d.getMinutes())}`}</tspan>
                  <tspan x={xy[i].x} dy="17">{`${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className={styles.legend}>
        <li><span style={{ background: STATUS_COLORS.low }} />Thấp</li>
        <li><span style={{ background: STATUS_COLORS.normal }} />Bình thường</li>
        <li><span style={{ background: STATUS_COLORS.above_target }} />Hơi cao</li>
        <li><span style={{ background: STATUS_COLORS.danger }} />Cao</li>
        <li className={styles.legendSafe}><span />Vùng an toàn {unit === 'mg/dL' ? '70–180' : '3.9–10'} {unit}</li>
      </ul>
    </div>
  );
}
