import { Pill, Clock, Calendar, CheckSquare } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix } from '../../utils/doctor';
import { exportMedicationToCalendar } from '../../utils/calendar';
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
  const times = Array.isArray(med.times) ? med.times : [];
  const prescribedAt = med.prescribed_at
    ? new Date(med.prescribed_at).toLocaleDateString('vi-VN')
    : null;

  const isMobile = window.innerWidth < 768;

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

      {times.length > 0 && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Giờ uống</div>
            <div className={styles.timeList}>
              {times.map((tm, i) => (
                <div key={i} className={styles.timeItem}>
                  <Clock size={14} color="#1B5FA6" /> {tm}
                </div>
              ))}
            </div>
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
        </>
      )}
    </Modal>
  );
}
