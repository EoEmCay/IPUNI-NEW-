import { create } from 'zustand';

const getTodayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `diaplus_medication_status_${y}-${m}-${day}`;
};

const loadInitialStatus = () => {
  try {
    const raw = localStorage.getItem(getTodayKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const useMedicationsStore = create((set) => ({
  medications: [],
  todayMedications: [],
  loading: false,
  // Trạng thái uống thuốc theo từng thuốc theo ngày hôm nay
  medicationStatus: loadInitialStatus(),
  setMedications: (medications) => set({ medications }),
  setTodayMedications: (todayMedications) => set({ todayMedications }),
  setLoading: (loading) => set({ loading }),
  setMedicationStatus: (id, status) =>
    set((state) => {
      const next = { ...state.medicationStatus, [id]: status };
      try {
        localStorage.setItem(getTodayKey(), JSON.stringify(next));
      } catch {}
      return { medicationStatus: next };
    }),
}));

export default useMedicationsStore;
