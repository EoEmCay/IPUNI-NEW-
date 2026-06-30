import { useEffect, useState } from 'react';
import { Stethoscope, FileText } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { useT } from '../../hooks/useT';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import DoctorNoteCard from '../../components/appointments/DoctorNoteCard';
import EmptyState from '../../components/common/EmptyState';
import styles from './AppointmentsPage.module.css';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('appointments');
  const { appointments, doctorNotes, loading, fetchAppointments, fetchDoctorNotes } = useAppointments();
  const t = useT();

  useEffect(() => {
    fetchAppointments('upcoming');
    fetchDoctorNotes();
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.appointments.title}</h1>
      <p className={styles.subtitle}>{t.appointments.subtitle}</p>

      <div className={styles.tabToggle}>
        <div className={`${styles.tab} ${activeTab === 'appointments' ? styles.active : ''}`} onClick={() => setActiveTab('appointments')}>
          {t.appointments.tabAppointments}
        </div>
        <div className={`${styles.tab} ${activeTab === 'doctor' ? styles.active : ''}`} onClick={() => setActiveTab('doctor')}>
          {t.appointments.tabDoctor}
        </div>
      </div>

      {activeTab === 'appointments' && (
        appointments.length === 0 ? (
          <EmptyState icon={Stethoscope} title={t.appointments.noAppointments} subtitle={t.appointments.noAppointmentsSubtitle} />
        ) : (
          <div className={styles.list}>{appointments.map((a) => <AppointmentCard key={a.id} appointment={a} />)}</div>
        )
      )}

      {activeTab === 'doctor' && (
        doctorNotes.length === 0 ? (
          <EmptyState icon={FileText} title={t.appointments.noDoctorNotes} subtitle={t.appointments.noDoctorNotesSubtitle} />
        ) : (
          <div className={styles.list}>{doctorNotes.map((n) => <DoctorNoteCard key={n.id} appointment={n} />)}</div>
        )
      )}
    </div>
  );
}
