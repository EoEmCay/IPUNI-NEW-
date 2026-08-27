import { useState } from 'react';
import { Pill, Clock, Calendar, CheckSquare } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix } from '../../utils/doctor';
import { exportMedicationToCalendar } from '../../utils/calendar';
import { isAlternateDayDose, extractMedicationTimes } from '../../utils/medicationTime';
import { medicationsService } from '../../services/medications.service';
import styles from './MedicationDetailModal.module.css';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export default function MedicationDetailModal({ medication, onClose }) {
  const med = medication || {};
  const initialTimes = extractMedicationTimes(med);
  const [currentTimes, setCurrentTimes] = useState(initialTimes);
  const [editTimesStr, setEditTimesStr] = useState(initialTimes.join(', '));
  const [isEditingTimes, setIsEditingTimes] = useState(false);
  const [isAlternate, setIsAlternate] = useState(() => isAlternateDayDose(med));
  const [isSaving, setIsSaving] = useState(false);

  const prescribedAt = med.prescribed_at
    ? new Date(med.prescribed_at).toLocaleDateString('vi-VN')
    : null;

  const isMobile = window.innerWidth < 768;

  const handleSaveTimes = async () => {
    setIsSaving(true);
    try {
      const timesArr = editTimesStr.split(',').map(s => s.trim()).filter(Boolean);
      let newFreq = med.frequency || '1 lần/ngày';
      if (isAlternate && !newFreq.toLowerCase().includes('cách ngày')) {
        newFreq = `${newFreq} (Cách ngày)`;
      } else if (!isAlternate && newFreq.toLowerCase().includes(' (cách ngày)')) {
        newFreq = newFreq.replace(' (Cách ngày)', '');
      }

      await medicationsService.update(med.id, {
        times: timesArr,
        frequency: newFreq
      });

      setCurrentTimes(timesArr);
      setIsEditingTimes(false);
      // Cập nhật object tham chiếu để các chỗ khác nhận luôn
      med.times = timesArr;
      med.frequency = newFreq;
    } catch (err) {
      alert('Có lỗi khi lưu giờ: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleCalendar = () => {
    // Generate Google Calendar URL
    const text = encodeURIComponent(`Uống thuốc: ${med.name}`);
    const details = encodeURIComponent(`Liều dùng: ${med.dosage}\nCách dùng: ${med.frequency}\nChỉ dẫn: ${med.instructions}`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
    window.open(url, '_blank');
  };

  const handleNotionCalendar = () => {
    // There is no direct deep link for Notion Calendar creation without auth, but we can open the app
    // or point to cron.com / notion calendar web. Let's just point to their web app.
    window.open('https://calendar.notion.so', '_blank');
  };

  return (
    <Modal title="Chi tiết thuốc" onClose={onClose}>
      <div className={styles.hero}>
        <div className={styles.imgWrap}>
          {med.image ? (
            <img src={med.image} alt={med.name} className={styles.img} draggable={false} />
          ) : (
            <Pill size={32} color="#1B5FA6" />
          )}
        </div>
        <div>
          <div className={styles.name}>{med.name}</div>
          {med.dosage && <div className={styles.dosage}>{med.dosage}</div>}
        </div>
      </div>

      <div className={styles.section}>
        <Row label="Tên đầy đủ" value={med.full_name || med.name} />
        <Row label="Xuất xứ" value={med.origin} />
        <Row label="Tác dụng chính" value={med.main_effect || med.instructions} />
        <Row label="Tác dụng phụ" value={med.side_effects} />
        <Row label="Liều dùng" value={med.frequency} />
        <Row label="Bác sĩ kê đơn" value={med.doctor_name ? withDoctorPrefix(med.doctor_name) : null} />
        <Row label="Ngày kê đơn" value={prescribedAt} />
      </div>

      {/* ── Chỉnh sửa giờ uống & Lịch cách ngày dành cho người nhà / người dùng ── */}
      <div className={styles.section} style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0', marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} color="#2563EB" /> Giờ uống thuốc & Tần suất
          </div>
          {!isEditingTimes ? (
            <button 
              onClick={() => setIsEditingTimes(true)}
              style={{ fontSize: 12, color: '#2563EB', background: 'white', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              ✏️ Chỉnh sửa giờ
            </button>
          ) : (
            <button 
              onClick={() => setIsEditingTimes(false)}
              style={{ fontSize: 12, color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Đóng
            </button>
          )}
        </div>

        {!isEditingTimes ? (
          <div>
            <div className={styles.timeList}>
              {currentTimes.map((tm, i) => (
                <div key={i} className={styles.timeItem}>
                  <Clock size={14} color="#1B5FA6" /> {tm}
                </div>
              ))}
            </div>
            {isAlternate && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#4338CA', background: '#EEF2FF', padding: '4px 10px', borderRadius: 6, display: 'inline-block', fontWeight: 600 }}>
                📅 Tần suất: Uống cách ngày (1 ngày uống, 1 ngày nghỉ)
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px' }}>
              💡 Đơn thuốc chỉ ghi Sáng/Trưa/Chiều? Bạn hoặc người nhà hãy chọn giờ uống phù hợp nhất với giờ ăn của gia đình:
            </p>

            {/* Chip chọn nhanh buổi */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {[
                { label: '🌅 Sáng', time: '07:00' },
                { label: '☀️ Trưa', time: '11:30' },
                { label: '🌆 Chiều', time: '15:30' },
                { label: '🌙 Tối', time: '18:30' },
                { label: '🛌 Trước ngủ', time: '21:30' }
              ].map((p, idx) => {
                const isSelected = editTimesStr.includes(p.time);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      let arr = editTimesStr.split(',').map(s => s.trim()).filter(Boolean);
                      if (isSelected) {
                        arr = arr.filter(t => t !== p.time);
                      } else {
                        arr.push(p.time);
                        arr.sort();
                      }
                      setEditTimesStr(arr.join(', '));
                    }}
                    style={{
                      fontSize: 12,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                      background: isSelected ? '#EFF6FF' : 'white',
                      color: isSelected ? '#1D4ED8' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label} ({p.time})
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
                Hoặc tự nhập giờ uống (cách nhau dấu phẩy):
              </label>
              <input
                type="text"
                value={editTimesStr}
                onChange={(e) => setEditTimesStr(e.target.value)}
                placeholder="VD: 07:00, 18:00"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
              />
            </div>

            {/* Checkbox cách ngày */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1E293B', cursor: 'pointer', marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={isAlternate}
                onChange={(e) => setIsAlternate(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#2563EB' }}
              />
              <span style={{ fontWeight: 600 }}>Uống cách ngày (2 ngày 1 lần / ngày uống ngày nghỉ)</span>
            </label>

            <button
              onClick={handleSaveTimes}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '10px',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              {isSaving ? 'Đang lưu...' : '✓ Lưu thay đổi giờ uống'}
            </button>
          </div>
        )}
      </div>

          {isMobile ? (
            <button 
              className={styles.calendarBtn} 
              onClick={() => exportMedicationToCalendar(med)}
            >
              <Calendar size={16} /> Thêm lịch nhắc vào điện thoại
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                className={styles.calendarBtn} 
                onClick={handleGoogleCalendar}
                style={{ flex: 1, background: '#4285F4', color: 'white' }}
              >
                <Calendar size={16} /> Google Calendar
              </button>
              <button 
                className={styles.calendarBtn} 
                onClick={handleNotionCalendar}
                style={{ flex: 1, background: '#111111', color: 'white' }}
              >
                <CheckSquare size={16} /> Notion Calendar
              </button>
            </div>
          )}
    </Modal>
  );
}
