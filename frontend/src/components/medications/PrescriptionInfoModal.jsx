import { Stethoscope, CalendarDays, CalendarClock, NotebookPen } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix, sameDoctor } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import styles from './PrescriptionInfoModal.module.css';

// Chi tiết 1 đơn thuốc: bác sĩ, ngày khám, ngày tái khám, lời dặn (thay cho tab Bác sĩ cũ).
export default function PrescriptionInfoModal({ group, appointments = [], onClose }) {
  const visit = appointments.find((a) => sameDoctor(a.doctor_name, group.doctor_name));
  const nextVisit = group.next_appointment_date || visit?.scheduled_at;
  const rows = [
    { icon: Stethoscope, label: 'Bác sĩ kê đơn', value: group.doctor_name ? withDoctorPrefix(group.doctor_name) : 'Không có (thuốc tự thêm)' },
    { icon: CalendarDays, label: 'Ngày khám', value: group.prescribed_at ? formatDateVN(group.prescribed_at) : null },
    { icon: CalendarClock, label: 'Ngày tái khám', value: nextVisit ? formatDateVN(nextVisit) : null },
    { icon: NotebookPen, label: 'Lời dặn của bác sĩ', value: visit?.note || null },
  ].filter((r) => r.value);

  return (
    <Modal title={`Đơn thuốc ${group.number}`} onClose={onClose}>
      <div className={styles.body}>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.row}>
            <Icon size={22} className={styles.icon} style={{ color: group.color.c }} aria-hidden="true" />
            <div>
              <p className={styles.label}>{label}</p>
              <p className={styles.value}>{value}</p>
            </div>
          </div>
        ))}
        <div className={styles.meds}>
          <p className={styles.label}>{group.medications.length} thuốc trong đơn</p>
          <ul className={styles.medList}>
            {group.medications.map((m) => <li key={m.id}>{m.name}</li>)}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
