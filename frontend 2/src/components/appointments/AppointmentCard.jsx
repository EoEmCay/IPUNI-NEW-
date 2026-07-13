import { useState } from 'react';
import { Stethoscope, ChevronRight } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { withDoctorPrefix } from '../../utils/doctor';
import DoctorDetailModal from './DoctorDetailModal';
import styles from './AppointmentCard.module.css';

function formatDate(dateStr, t) {
  const d = new Date(dateStr);
  const days = t.days || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[d.getDay()];
  const pad = (n) => String(n).padStart(2, '0');
  return `${dayName}, ${pad(d.getDate())} ${t.months?.[d.getMonth()] || (d.getMonth() + 1)} ${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentCard({ appointment }) {
  const t = useT();
  const [showDetail, setShowDetail] = useState(false);
  const statusLabels = {
    upcoming: t.appointments?.statusUpcoming || 'Upcoming',
    completed: t.appointments?.statusCompleted || 'Completed',
    cancelled: t.appointments?.statusCancelled || 'Cancelled',
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}><Stethoscope size={22} /></div>
      <div className={styles.info}>
        {/* Tên bác sĩ nổi bật */}
        <div className={styles.doctorName}>{withDoctorPrefix(appointment.doctor_name)}</div>
        {appointment.department && <div className={styles.doctorTitle}>{appointment.department}</div>}

        {/* Thông tin lịch hẹn (mờ hơn) */}
        <div className={styles.divider} />
        <div className={styles.apptLabel}>{t.appointments?.retakeSchedule || 'Appointment'}</div>
        <div className={styles.datetime}>{formatDate(appointment.scheduled_at, t)}</div>
        {appointment.location && <div className={styles.location}>{appointment.location}</div>}

        <button className={styles.detailBtn} onClick={() => setShowDetail(true)}>
          Chi tiết bác sĩ <ChevronRight size={13} />
        </button>
      </div>
      <span className={`${styles.statusBadge} ${styles[appointment.status]}`}>
        {statusLabels[appointment.status]}
      </span>

      {showDetail && (
        <DoctorDetailModal appointment={appointment} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}
