import { useState } from 'react';
import Modal from '../common/Modal';
import { getGlucoseUnit, toMmol } from '../../utils/glucoseUnit';
import styles from './GlucoseQuickModal.module.css';

const TYPES = [
  { key: 'glucose_fasting', label: 'Lúc đói' },
  { key: 'glucose_postmeal', label: 'Sau ăn 2 giờ' },
];

// Nhập đường huyết 1 bước: chọn lúc đo, gõ số (bàn phím số của điện thoại), Lưu.
export default function GlucoseQuickModal({ onClose, onSave }) {
  const [type, setType] = useState('glucose_fasting');
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const unit = getGlucoseUnit(); // gõ theo đơn vị người dùng đã chọn, lưu bằng mmol/L
  const [min, max, example] = unit === 'mg/dL' ? [2, 900, '120'] : [0.1, 50, '6.5'];

  const value = parseFloat(raw.replace(',', '.'));

  const submit = async (e) => {
    e.preventDefault();
    if (isNaN(value) || value < min || value > max) {
      setError(`Hãy nhập số đo từ ${min} đến ${max} ${unit}, ví dụ ${example}`);
      return;
    }
    setSaving(true);
    try {
      await onSave({ measurement_type: type, value: toMmol(value, unit), measured_at: new Date().toISOString() });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa lưu được. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Ghi đường huyết" onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.types} role="radiogroup" aria-label="Thời điểm đo">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={type === t.key}
              className={`${styles.type} ${type === t.key ? styles.typeActive : ''}`}
              onClick={() => setType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label htmlFor="glucose-value" className={styles.label}>Số đo</label>
        <div className={styles.valueRow}>
          <input
            id="glucose-value"
            className={styles.value}
            inputMode="decimal"
            placeholder={example}
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(''); }}
            autoFocus
          />
          <span className={styles.unit}>{unit}</span>
        </div>
        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.save} disabled={saving || !raw.trim()}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </Modal>
  );
}
