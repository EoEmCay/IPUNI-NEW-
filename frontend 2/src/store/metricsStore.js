import { create } from 'zustand';

const useMetricsStore = create((set) => ({
  // Glucose & HbA1c readings
  metrics: [],
  latestMetrics: null,
  statistics: null,

  // UI state
  loading: false,
  error: null,

  // Setters
  setMetrics: (metrics) => set({ metrics }),
  setLatestMetrics: (latestMetrics) => set({ latestMetrics }),
  setStatistics: (statistics) => set({ statistics }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

export default useMetricsStore;
