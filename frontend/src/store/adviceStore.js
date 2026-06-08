import { create } from 'zustand';

const useAdviceStore = create((set) => ({
  advice: [],
  loading: false,
  setAdvice: (advice) => set({ advice }),
  setLoading: (loading) => set({ loading }),
}));

export default useAdviceStore;
