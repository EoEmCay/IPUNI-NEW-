import { useCallback, useEffect, useState } from 'react';
import useNotificationsStore from '../store/notificationsStore';
import { useMedications } from './useMedications';
import { useAppointments } from './useAppointments';

export function useNotifications() {
  const { isOpen, medications, appointments, setOpen, setMedications, setAppointments } = useNotificationsStore();
  const { todayMedications, fetchToday } = useMedications();
  const { appointments: allAppointments, fetchAppointments } = useAppointments();
  const [isTimeToDrink, setIsTimeToDrink] = useState(false);
  const [upcomingMeds, setUpcomingMeds] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchToday();
    fetchAppointments('upcoming');
  }, [fetchToday, fetchAppointments]);

  // Check if current time matches any medication time
  const checkMedicationTime = useCallback((meds) => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    // Check if any medication should be taken now (within ±5 minutes tolerance)
    const nowTime = now.getHours() * 60 + now.getMinutes();

    const upcomingList = meds.filter(med => {
      if (!med.times) return false;
      const times = typeof med.times === 'string' ? JSON.parse(med.times) : med.times;

      return times.some(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const medTime = h * 60 + m;
        const diff = Math.abs(nowTime - medTime);
        return diff <= 5; // Within ±5 minutes
      });
    });

    return upcomingList.length > 0;
  }, []);

  // Update notifications when data changes
  useEffect(() => {
    // Filter today's medications
    const activeMeds = todayMedications?.filter(m => m.is_active) || [];
    setMedications(activeMeds);

    // Check if it's time to drink
    const isTime = checkMedicationTime(activeMeds);
    setIsTimeToDrink(isTime);
    setUpcomingMeds(activeMeds.filter(med => {
      if (!med.times) return false;
      const times = typeof med.times === 'string' ? JSON.parse(med.times) : med.times;
      const now = new Date();
      const nowTime = now.getHours() * 60 + now.getMinutes();
      return times.some(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const medTime = h * 60 + m;
        return Math.abs(nowTime - medTime) <= 5;
      });
    }));

    // Filter upcoming appointments (today and soon)
    const upcomingAppts = allAppointments?.filter(a => a.status === 'upcoming') || [];
    setAppointments(upcomingAppts);
  }, [todayMedications, allAppointments, setMedications, setAppointments, checkMedicationTime]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const hasNotifications = medications.length > 0 || appointments.length > 0;

  return {
    isOpen,
    medications,
    appointments,
    hasNotifications,
    isTimeToDrink,
    upcomingMeds,
    handleOpen,
    handleClose,
  };
}
