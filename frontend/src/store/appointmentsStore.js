import { create } from 'zustand';

const useAppointmentsStore = create((set) => ({
  appointments: [],
  doctorNotes: [],
  loading: false,
  setAppointments: (appointments) => set({ appointments }),
  setDoctorNotes: (doctorNotes) => set({ doctorNotes }),
  setLoading: (loading) => set({ loading }),
}));

export default useAppointmentsStore;
