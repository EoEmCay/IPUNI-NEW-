import { create } from 'zustand';
import { getSyncCache, CACHE_KEYS } from '../services/localCache';

const getTodayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `diaplus_medication_status_v2_${y}-${m}-${day}`;
};

const loadInitialStatus = () => {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(getTodayKey()) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const useMedicationsStore = create((set) => ({
  // Nạp tức thì từ local cache trong 0.00 giây để không bao giờ bị chớp màn hình trắng
  medications: getSyncCache(CACHE_KEYS.ALL_MEDICATIONS, []),
  todayMedications: getSyncCache(CACHE_KEYS.TODAY_MEDICATIONS, []),
  loading: false,
  statusVersion: 0,
  // Trạng thái uống thuốc theo từng thuốc/cữ trong ngày hôm nay
  medicationStatus: loadInitialStatus(),
  setMedications: (medications) => set({ medications }),
  setTodayMedications: (todayMedications) => set({ todayMedications }),
  setLoading: (loading) => set({ loading }),
  setMedicationStatus: (id, status, slotPeriod = null) =>
    set((state) => {
      const next = { ...state.medicationStatus };
      if (slotPeriod) {
        next[`${id}_${slotPeriod}`] = status;
      }
      next[id] = status;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(getTodayKey(), JSON.stringify(next));
        }
      } catch {
        /* ignore */
      }
      return {
        medicationStatus: next,
        statusVersion: state.statusVersion + 1,
      };
    }),
  markMedicationStatus: (id, status, slotPeriod = null) =>
    set((state) => {
      const next = { ...state.medicationStatus };
      if (slotPeriod) {
        next[`${id}_${slotPeriod}`] = status;
      }
      next[id] = status;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(getTodayKey(), JSON.stringify(next));
        }
      } catch {
        /* ignore */
      }
      return {
        medicationStatus: next,
        statusVersion: state.statusVersion + 1,
      };
    }),
}));

export default useMedicationsStore;
