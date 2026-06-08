import { Trash2 } from 'lucide-react';
import { METRIC_TYPES, getMetricStatus } from '../../constants/metrics';

const STATUS_COLORS = {
  normal: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  low: '#7C3AED'
};

const STATUS_LABELS = {
  normal: 'Bình thường',
  warning: 'Chú ý',
  danger: 'Nguy hiểm',
  low: 'Hạ đường huyết'
};

export default function MetricHistoryItem({ metric, onDelete }) {
  const meta = METRIC_TYPES[metric.type];
  const status = getMetricStatus(metric.type, metric.value);
  const color = STATUS_COLORS[status];

  const dt = new Date(metric.measured_at);
  const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const dateStr = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', gap: 12 }}>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1A2332' }}>{metric.value}</span>
          <span style={{ fontSize: 12, color: '#6B7A8D' }}>mmol/L</span>
          <span style={{ fontSize: 11, fontWeight: 600, color, marginLeft: 4, background: `${color}18`, padding: '2px 7px', borderRadius: 20 }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#6B7A8D', marginTop: 2 }}>
          {meta?.label} · {timeStr} {dateStr}
        </div>
        {metric.note && <div style={{ fontSize: 12, color: '#6B7A8D', marginTop: 2, fontStyle: 'italic' }}>{metric.note}</div>}
      </div>
      <button onClick={() => onDelete(metric.id)} style={{ color: '#EF4444', padding: 6, borderRadius: 8, background: '#FFF1F2' }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}
