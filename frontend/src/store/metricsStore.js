import { create } from 'zustand';
import { getSyncCache, CACHE_KEYS } from '../services/localCache';

const useMetricsStore = create((set) => ({
  // Khởi tạo ngay từ snapshot bộ nhớ đệm để hiển thị chỉ số tức thì khi mở app
  metrics: getSyncCache(CACHE_KEYS.METRICS_LIST, []),
  latestMetrics: getSyncCache(CACHE_KEYS.LATEST_METRICS, null),
  statistics: null,

  // UI state
  loading: false,
  error: null,

  // Setters
  setMetrics: (metrics) => set({ metrics }),
  setLatestMetrics: (latestMetrics) => set({ latestMetrics }),
  setStatistics: (statistics) => set({ statistics }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useMetricsStore;
