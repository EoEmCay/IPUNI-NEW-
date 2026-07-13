import { create } from 'zustand';

const useMedicationsStore = create((set) => ({
  medications: [],
  todayMedications: [],
  loading: false,
  // Trạng thái uống thuốc theo từng thuốc: { [medId]: 'pending' | 'taken' | 'late' }
  medicationStatus: {},
  setMedications: (medications) => set({ medications }),
  setTodayMedications: (todayMedications) => set({ todayMedications }),
  setLoading: (loading) => set({ loading }),
  setMedicationStatus: (id, status) =>
    set((state) => ({ medicationStatus: { ...state.medicationStatus, [id]: status } })),
}));

export default useMedicationsStore;
