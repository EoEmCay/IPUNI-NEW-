import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { METRIC_TYPES } from '../../constants/metrics';
import styles from './AddMetricModal.module.css';

function nowLocalISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}

export default function AddMetricModal({ onClose, onSave, onSuccess, defaultType }) {
  const { date, time } = nowLocalISO();
  const [type, setType] = useState(defaultType || 'fasting');
  const [value, setValue] = useState('');
  const [measuredDate, setMeasuredDate] = useState(date);
  const [measuredTime, setMeasuredTime] = useState(time);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num < 0.1 || num > 50) {
      setError('Vui lòng nhập giá trị hợp lệ (0.1 – 50 mmol/L)');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const measured_at = new Date(`${measuredDate}T${measuredTime}:00`).toISOString();
      await onSave({ type, value: num, measured_at, note: note.trim() || undefined });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Nhập chỉ số" onClose={onClose}>
      <div className={styles.group}>
        <label className={styles.label}>Loại đường huyết</label>
        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(METRIC_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Giá trị (mmol/L)</label>
        <div className={styles.valueRow}>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            min="0.1"
            max="50"
            placeholder="Ví dụ: 6.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className={styles.unit}>mmol/L</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Thời gian đo</label>
        <div className={styles.dateRow}>
          <input className={styles.input} type="date" value={measuredDate} onChange={(e) => setMeasuredDate(e.target.value)} />
          <input className={styles.input} type="time" value={measuredTime} onChange={(e) => setMeasuredTime(e.target.value)} />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Ghi chú (tùy chọn)</label>
        <textarea className={styles.textarea} placeholder="Ghi chú..." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button full onClick={handleSave} disabled={saving}>
        {saving ? 'Đang lưu...' : 'Lưu chỉ số'}
      </Button>
    </Modal>
  );
}
