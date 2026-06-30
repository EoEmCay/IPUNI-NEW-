import { useCallback } from 'react';
import useAppointmentsStore from '../store/appointmentsStore';
import { appointmentsService } from '../services/appointments.service';

export function useAppointments() {
  const { appointments, doctorNotes, loading, setAppointments, setDoctorNotes, setLoading } = useAppointmentsStore();

  const fetchAppointments = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await appointmentsService.getAll(status);
      setAppointments(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctorNotes = useCallback(async () => {
    try {
      const res = await appointmentsService.getDoctorNotes();
      setDoctorNotes(res.data.data);
    } catch {}
  }, []);

  return { appointments, doctorNotes, loading, fetchAppointments, fetchDoctorNotes };
}
