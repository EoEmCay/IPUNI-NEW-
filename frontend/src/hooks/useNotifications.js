import { useCallback, useEffect, useMemo } from 'react';
import useNotificationsStore from '../store/notificationsStore';
import { useMedications } from './useMedications';
import { useAppointments } from './useAppointments';

export function useNotifications() {
  const { isOpen, medications, appointments, setOpen, setMedications, setAppointments } = useNotificationsStore();
  const { todayMedications, fetchToday } = useMedications();
  const { appointments: allAppointments, fetchAppointments } = useAppointments();

  // Fetch data on mount
  useEffect(() => {
    fetchToday();
    fetchAppointments('upcoming');
  }, [fetchToday, fetchAppointments]);

  // Thuốc nào đang trong khung giờ uống (±5 phút) - tính lại mỗi khi danh sách thuốc đổi,
  // không cần useState+effect riêng vì đây thuần là giá trị suy ra từ todayMedications.
  const activeMeds = useMemo(() => todayMedications?.filter(m => m.is_active) || [], [todayMedications]);
  const upcomingAppts = useMemo(() => allAppointments?.filter(a => a.status === 'upcoming') || [], [allAppointments]);

  const checkMedicationTime = useCallback((meds) => {
    const now = new Date();
    const nowTime = now.getHours() * 60 + now.getMinutes();
    return meds.some(med => {
      if (!med.times) return false;
      const times = typeof med.times === 'string' ? JSON.parse(med.times) : med.times;
      return times.some(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const medTime = h * 60 + m;
        return Math.abs(nowTime - medTime) <= 5; // Within ±5 minutes
      });
    });
  }, []);

  const upcomingMeds = useMemo(
    () => activeMeds.filter(med => {
      if (!med.times) return false;
      const times = typeof med.times === 'string' ? JSON.parse(med.times) : med.times;
      const now = new Date();
      const nowTime = now.getHours() * 60 + now.getMinutes();
      return times.some(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const medTime = h * 60 + m;
        return Math.abs(nowTime - medTime) <= 5;
      });
    }),
    [activeMeds]
  );

  const isTimeToDrink = useMemo(() => checkMedicationTime(activeMeds), [activeMeds, checkMedicationTime]);

  // Đồng bộ vào store dùng chung (TopBar/UserMenu đọc qua đây) - đây là lý do chính đáng
  // để dùng effect: đưa dữ liệu React đã tính ra hệ thống ngoài (Zustand store), không phải
  // tính toán state nội bộ.
  useEffect(() => {
    setMedications(activeMeds);
    setAppointments(upcomingAppts);
  }, [activeMeds, upcomingAppts, setMedications, setAppointments]);

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
