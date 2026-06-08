import { create } from 'zustand';

const useMedicationsStore = create((set) => ({
  medications: [],
  todayMedications: [],
  loading: false,
  setMedications: (medications) => set({ medications }),
  setTodayMedications: (todayMedications) => set({ todayMedications }),
  setLoading: (loading) => set({ loading }),
}));

export default useMedicationsStore;
