import { Stethoscope } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix } from '../../utils/doctor';
import styles from './DoctorDetailModal.module.css';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export default function DoctorDetailModal({ appointment, onClose }) {
  const a = appointment || {};
  return (
    <Modal title="Thông tin bác sĩ" onClose={onClose}>
      <div className={styles.hero}>
        <div className={styles.avatar}><Stethoscope size={30} color="#1B5FA6" /></div>
        <div>
          <div className={styles.name}>{withDoctorPrefix(a.doctor_name)}</div>
          {(a.title || a.degree) && (
            <div className={styles.title}>{a.title || a.degree}</div>
          )}
          {a.department && <div className={styles.dept}>{a.department}</div>}
        </div>
      </div>

      <div className={styles.section}>
        <Row label="Họ tên" value={a.doctor_name ? withDoctorPrefix(a.doctor_name) : null} />
        <Row label="Học vị" value={a.degree} />
        <Row label="Chức danh" value={a.title} />
        <Row label="Nơi công tác" value={a.location || a.department} />
        <Row label="Quá trình công tác" value={a.work_history} />
        <Row label="Liên hệ" value={a.contact} />
      </div>
    </Modal>
  );
}
