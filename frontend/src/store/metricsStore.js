import { create } from 'zustand';

const useMetricsStore = create((set) => ({
  metrics: [],
  latestMetrics: null,
  loading: false,

  setMetrics: (metrics) => set({ metrics }),
  setLatestMetrics: (latestMetrics) => set({ latestMetrics }),
  setLoading: (loading) => set({ loading }),
}));

export default useMetricsStore;
