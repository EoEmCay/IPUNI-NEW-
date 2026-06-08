import { useEffect, useState } from 'react';
import { CalendarDays, FileText } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import DoctorNoteCard from '../../components/appointments/DoctorNoteCard';
import EmptyState from '../../components/common/EmptyState';
import styles from './AppointmentsPage.module.css';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('appointments');
  const { appointments, doctorNotes, loading, fetchAppointments, fetchDoctorNotes } = useAppointments();

  useEffect(() => {
    fetchAppointments('upcoming');
    fetchDoctorNotes();
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Lịch hẹn & Hướng dẫn</h1>
      <p className={styles.subtitle}>Lịch tái khám và chỉ dẫn từ bác sĩ</p>

      <div className={styles.tabToggle}>
        <div className={`${styles.tab} ${activeTab === 'appointments' ? styles.active : ''}`} onClick={() => setActiveTab('appointments')}>
          Lịch hẹn
        </div>
        <div className={`${styles.tab} ${activeTab === 'doctor' ? styles.active : ''}`} onClick={() => setActiveTab('doctor')}>
          Từ bác sĩ
        </div>
      </div>

      {activeTab === 'appointments' && (
        appointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Chưa có lịch hẹn" subtitle="Bác sĩ sẽ đặt lịch tái khám cho bạn sau mỗi lần khám." />
        ) : (
          <div className={styles.list}>{appointments.map((a) => <AppointmentCard key={a.id} appointment={a} />)}</div>
        )
      )}

      {activeTab === 'doctor' && (
        doctorNotes.length === 0 ? (
          <EmptyState icon={FileText} title="Chưa có chỉ dẫn" subtitle="Bác sĩ sẽ ghi chỉ dẫn cho bạn sau mỗi lần khám." />
        ) : (
          <div className={styles.list}>{doctorNotes.map((n) => <DoctorNoteCard key={n.id} appointment={n} />)}</div>
        )
      )}
    </div>
  );
}
