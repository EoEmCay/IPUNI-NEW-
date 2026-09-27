import { useState } from 'react';
import Modal from '../common/Modal';
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

  const value = parseFloat(raw.replace(',', '.'));

  const submit = async (e) => {
    e.preventDefault();
    if (isNaN(value) || value < 0.1 || value > 50) {
      setError('Hãy nhập số đo từ 0.1 đến 50 mmol/L, ví dụ 6.5');
      return;
    }
    setSaving(true);
    try {
      await onSave({ measurement_type: type, value, measured_at: new Date().toISOString() });
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
            placeholder="6.5"
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(''); }}
            autoFocus
          />
          <span className={styles.unit}>mmol/L</span>
        </div>
        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.save} disabled={saving || !raw.trim()}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </Modal>
  );
}
