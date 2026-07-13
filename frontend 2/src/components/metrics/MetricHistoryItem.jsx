import { Trash2, AlertTriangle } from 'lucide-react';
import { METRIC_TYPES, getMetricStatus, STATUS_COLORS } from '../../constants/metrics';
import { useT } from '../../hooks/useT';

export default function MetricHistoryItem({ metric, onDelete }) {
  const t = useT();
  const type = metric.measurement_type || metric.type;
  const meta = METRIC_TYPES[type] || {};
  const typeLabel = t.metrics?.types?.[type] || meta.label || type;
  const status = getMetricStatus(type, metric.value);
  const color = STATUS_COLORS[status] || '#22C55E';
  const unit = meta.unit || metric.unit || 'mmol/L';

  const statusLabels = {
    normal: t.metrics?.statusNormal || 'Normal',
    prediabetes: t.metrics?.statusPrediabetes || 'Prediabetes',
    danger: t.metrics?.statusDanger || 'Danger',
    low: t.metrics?.statusLow || 'Low'
  };

  const dt = new Date(metric.measured_at);
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  const dateStr = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', gap: 12 }}>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color }}>{metric.value}</span>
          <span style={{ fontSize: 12, color: '#6B7A8D' }}>{unit}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color, marginLeft: 4, background: `${color}18`, padding: '2px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {status === 'danger' && <AlertTriangle size={11} color={color} />}
            {statusLabels[status]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#6B7A8D', marginTop: 2 }}>
          {typeLabel} · {timeStr} {dateStr}
        </div>
        {metric.note && <div style={{ fontSize: 12, color: '#6B7A8D', marginTop: 2, fontStyle: 'italic' }}>{metric.note}</div>}
      </div>
      <button onClick={() => onDelete(metric.id)} style={{ color: '#EF4444', padding: 6, borderRadius: 8, background: '#FFF1F2' }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}
