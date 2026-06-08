import { CalendarDays } from 'lucide-react';
import styles from './AppointmentCard.module.css';

const STATUS_LABELS = { upcoming: 'Sắp tới', completed: 'Đã khám', cancelled: 'Đã hủy' };

function formatVNDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[d.getDay()];
  const pad = (n) => String(n).padStart(2, '0');
  return `${dayName}, ${pad(d.getDate())} tháng ${pad(d.getMonth() + 1)} ${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentCard({ appointment }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}><CalendarDays size={22} /></div>
      <div className={styles.info}>
        <div className={styles.title}>Tái khám định kỳ</div>
        <div className={styles.doctor}>Dr. {appointment.doctor_name}{appointment.department ? ` - ${appointment.department}` : ''}</div>
        <div className={styles.datetime}>{formatVNDate(appointment.scheduled_at)}</div>
        {appointment.location && <div className={styles.location}>{appointment.location}</div>}
      </div>
      <span className={`${styles.statusBadge} ${styles[appointment.status]}`}>
        {STATUS_LABELS[appointment.status]}
      </span>
    </div>
  );
}
