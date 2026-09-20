import { useState } from 'react';
import Modal from '../common/Modal';
import styles from './SkipDoseModal.module.css';

const PRESET_REASONS = [
  'Đau dạ dày / Buồn nôn',
  'Đang bị tụt đường huyết',
  'Hết thuốc chưa kịp mua',
  'Bác sĩ chỉ định tạm dừng',
  'Lý do khác',
];

/**
 * Modal chọn nhanh lý do bỏ qua 1 cữ thuốc — giúp bác sĩ trên Clinic Portal nắm được
 * nguyên nhân y khoa thay vì chỉ thấy cờ "missed"/"skipped" trơ trọi.
 */
export default function SkipDoseModal({ medication, onConfirm, onClose }) {
  const [selected, setSelected] = useState(PRESET_REASONS[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    const isOther = selected === 'Lý do khác';
    const trimmedNote = note.trim();
    const reason = isOther
      ? (trimmedNote || 'Lý do khác')
      : (trimmedNote ? `${selected} — ${trimmedNote}` : selected);
    try {
      await onConfirm(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Bỏ qua cữ: ${medication?.name || ''}`} onClose={onClose}>
      <div className={styles.wrap}>
        <p className={styles.hint}>
          Cho bác sĩ biết vì sao bác chưa uống cữ này nhé — thông tin này sẽ hiển thị trên hồ sơ khám của bác.
        </p>

        <div className={styles.reasonList}>
          {PRESET_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.reasonBtn} ${selected === r ? styles.reasonBtnActive : ''}`}
              onClick={() => setSelected(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <label className={styles.noteLabel} htmlFor="skipDoseNote">
          Ghi chú thêm {selected === 'Lý do khác' ? '' : '(tùy chọn)'}
        </label>
        <textarea
          id="skipDoseNote"
          className={styles.noteInput}
          rows={3}
          maxLength={200}
          placeholder="VD: Bị đau bụng từ sáng nay..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Huỷ
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Xác nhận bỏ qua'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
