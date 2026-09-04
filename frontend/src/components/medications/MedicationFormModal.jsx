import { useState } from 'react';
import Modal from '../common/Modal';
import { medicationsService } from '../../services/medications.service';
import styles from './MedicationFormModal.module.css';

const QUICK_TIMES = [
  { label: 'Sáng', time: '07:00' },
  { label: 'Trưa', time: '11:30' },
  { label: 'Chiều', time: '15:30' },
  { label: 'Tối', time: '18:30' },
  { label: 'Trước ngủ', time: '21:30' },
];

export default function MedicationFormModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '1 lần/ngày',
    times: '08:00',
    instructions: 'Uống sau ăn'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('Vui lòng nhập tên thuốc');

    setLoading(true);
    try {
      const timesArray = formData.times.split(',').map(t => t.trim()).filter(Boolean);
      await medicationsService.create({
        ...formData,
        times: timesArray.length > 0 ? timesArray : ['08:00']
      });
      onSuccess();
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const timesArr = formData.times.split(',').map(s => s.trim()).filter(Boolean);

  const toggleQuickTime = (time) => {
    let nextArr = [...timesArr];
    if (nextArr.includes(time)) {
      nextArr = nextArr.filter(t => t !== time);
    } else {
      nextArr.push(time);
      nextArr.sort();
    }
    setFormData(prev => ({ ...prev, times: nextArr.join(', ') }));
  };

  const footer = (
    <div className={styles.footer}>
      <button type="button" className={styles.backBtn} onClick={onClose}>
        Quay lại
      </button>
      <button type="submit" form="medFormAdd" className={styles.saveBtn} disabled={loading}>
        {loading ? 'Đang lưu...' : 'Lưu vào lịch'}
      </button>
    </div>
  );

  return (
    <Modal title="Thêm thuốc mới" onClose={onClose} footer={footer}>
      <form id="medFormAdd" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Tên thuốc</label>
          <input
            type="text" name="name"
            value={formData.name} onChange={handleChange}
            className={styles.input}
            placeholder="VD: Glucophage"
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Liều lượng</label>
            <input
              type="text" name="dosage"
              value={formData.dosage} onChange={handleChange}
              className={styles.input}
              placeholder="VD: 500mg"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tần suất</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="1 lần/ngày">1 lần/ngày (Hàng ngày)</option>
              <option value="2 lần/ngày">2 lần/ngày (Sáng &amp; Tối)</option>
              <option value="3 lần/ngày">3 lần/ngày (Sáng, Trưa &amp; Tối)</option>
              <option value="Cách ngày (2 ngày 1 lần)">Cách ngày (2 ngày 1 lần)</option>
              <option value="Thứ 2, 4, 6">Lịch Thứ 2, 4, 6</option>
              <option value="Thứ 3, 5, 7">Lịch Thứ 3, 5, 7</option>
              <option value="Khi cần">Khi cần thiết</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Giờ nhắc uống</label>
            <span className={styles.hint}>Bấm chọn nhanh buổi</span>
          </div>

          <div className={styles.quickGrid}>
            {QUICK_TIMES.map((p) => {
              const isSelected = timesArr.includes(p.time);
              return (
                <button
                  key={p.time}
                  type="button"
                  className={`${styles.quickBtn} ${isSelected ? styles.quickBtnActive : ''}`}
                  onClick={() => toggleQuickTime(p.time)}
                >
                  {p.label} {p.time}
                </button>
              );
            })}
          </div>

          <input
            type="text" name="times"
            inputMode="numeric"
            value={formData.times} onChange={handleChange}
            className={styles.input}
            placeholder="VD: 07:00, 18:00"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Lời dặn</label>
          <input
            type="text" name="instructions"
            value={formData.instructions} onChange={handleChange}
            className={styles.input}
          />
        </div>
      </form>
    </Modal>
  );
}
