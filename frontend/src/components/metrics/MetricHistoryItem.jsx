import { Trash2, AlertTriangle } from 'lucide-react';
import { METRIC_TYPES, getMetricStatus, STATUS_COLORS } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import { getGlucoseUnit, formatGlucose } from '../../utils/glucoseUnit';
import useAuthStore from '../../store/authStore';

export default function MetricHistoryItem({ metric, onDelete, unit: glucoseUnit = getGlucoseUnit() }) {
  const t = useT();
  const diagnosis = useAuthStore((s) => s.user?.diagnosis);
  const type = metric.measurement_type || metric.type;
  const meta = METRIC_TYPES[type] || {};
  const typeLabel = t.metrics?.types?.[type] || meta.label || type;
  const status = getMetricStatus(type, metric.value, diagnosis);
  const color = STATUS_COLORS[status] || '#22C55E';
  const isGlucose = meta.category === 'glucose';
  const unit = isGlucose ? glucoseUnit : (meta.unit || metric.unit || 'mmol/L');

  // Huyết áp dùng bộ nhãn riêng - "Tiền đái tháo đường" là thuật ngữ đường huyết, không có
  // ý nghĩa y khoa khi gắn cho một chỉ số huyết áp (xem metrics.calculator.js#calculateBloodPressureStatus).
  const statusLabels = type === 'blood_pressure' ? {
    normal: t.metrics?.bpNormal || 'Bình thường',
    elevated: t.metrics?.bpElevated || 'Huyết áp cao',
    danger: t.metrics?.bpDanger || 'Tăng huyết áp nặng',
    low: t.metrics?.bpLow || 'Huyết áp thấp'
  } : {
    normal: t.metrics?.statusNormal || 'Normal',
    prediabetes: t.metrics?.statusPrediabetes || 'Prediabetes',
    above_target: t.metrics?.statusAboveTarget || 'Trên mục tiêu',
    danger: t.metrics?.statusDanger || 'Danger',
    low: t.metrics?.statusLow || 'Low'
  };

  const dt = new Date(metric.measured_at);
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  const dateStr = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', gap: 12 }}>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color }}>{isGlucose ? formatGlucose(metric.value, glucoseUnit) : metric.value}</span>
          <span style={{ fontSize: 15, color: '#6B7A8D' }}>{unit}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color, marginLeft: 4, background: `${color}18`, padding: '2px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {status === 'danger' && <AlertTriangle size={11} color={color} />}
            {statusLabels[status]}
          </span>
        </div>
        <div style={{ fontSize: 15, color: '#6B7A8D', marginTop: 2 }}>
          {typeLabel} · {timeStr} ngày {dateStr}
        </div>
        {metric.note && <div style={{ fontSize: 15, color: '#6B7A8D', marginTop: 2, fontStyle: 'italic' }}>{metric.note}</div>}
      </div>
      <button onClick={() => onDelete(metric.id)} aria-label="Xóa lần đo" style={{ color: '#EF4444', minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#FFF1F2' }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}
