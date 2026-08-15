import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { MEASUREMENT_TYPES, METRIC_TYPES } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import styles from './AddMetricModal.module.css';

function nowLocalParts() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}

export default function AddMetricModal({ onClose, onSave, onSuccess, defaultType }) {
  const { date, time } = nowLocalParts();
  const t = useT();
  const [measurementType, setMeasurementType] = useState(defaultType || MEASUREMENT_TYPES.GLUCOSE_FASTING);
  const [value, setValue] = useState('');
  const [measuredDate, setMeasuredDate] = useState(date);
  const [measuredTime, setMeasuredTime] = useState(time);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const meta = METRIC_TYPES[measurementType] || METRIC_TYPES.glucose_fasting;
  const { unit, min: minValue, max: maxValue, placeholder } = meta;

  const handleSave = async () => {
    const num = parseFloat(value);

    if (!value || isNaN(num) || num < minValue || num > maxValue) {
      setError(`${meta.label}: ${minValue} – ${maxValue} ${unit}`);
      return;
    }

    setError('');
    setSaving(true);

    try {
      const measured_at = new Date(`${measuredDate}T${measuredTime}:00`).toISOString();
      const payload = {
        measurement_type: measurementType,
        value: num,
        measured_at,
        note: note.trim() || undefined
      };
      
      await onSave(payload);
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || t.addMetric?.errorGeneric || 'Error saving metric');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t.addMetric?.title || 'Add Measurement'} onClose={onClose}>
      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric?.typeLabel || 'Type'}</label>
        <select
          className={styles.select}
          value={measurementType}
          onChange={(e) => { setMeasurementType(e.target.value); setError(''); }}
        >
          <option value={MEASUREMENT_TYPES.GLUCOSE_FASTING}>
            {t.metrics?.types?.glucose_fasting || METRIC_TYPES.glucose_fasting.label}
          </option>
          <option value={MEASUREMENT_TYPES.HBAIC}>
            {t.metrics?.types?.hba1c || METRIC_TYPES.hba1c.label}
          </option>
          <option value={MEASUREMENT_TYPES.C_PEPTIDE}>
            {t.metrics?.types?.c_peptide || METRIC_TYPES.c_peptide.label}
          </option>
          <option value={MEASUREMENT_TYPES.GLUCOSE_TOLERANCE}>
            {t.metrics?.types?.glucose_tolerance || METRIC_TYPES.glucose_tolerance.label}
          </option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric?.valueLabel || 'Value'} ({unit})</label>
        <div className={styles.valueRow}>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            min={minValue}
            max={maxValue}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className={styles.unit}>{unit}</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric?.timeLabel || 'Time'}</label>
        <div className={styles.dateRow}>
          <input
            className={styles.input}
            type="date"
            value={measuredDate}
            onChange={(e) => setMeasuredDate(e.target.value)}
          />
          <input
            className={styles.input}
            type="time"
            value={measuredTime}
            onChange={(e) => setMeasuredTime(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric?.noteLabel || 'Note'}</label>
        <textarea
          className={styles.textarea}
          placeholder={t.addMetric?.notePlaceholder || 'Optional notes...'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button full onClick={handleSave} disabled={saving}>
        {saving ? t.addMetric?.saving || 'Saving...' : t.addMetric?.saveBtn || 'Save'}
      </Button>
    </Modal>
  );
}
