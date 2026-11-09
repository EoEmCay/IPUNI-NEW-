import { useCallback } from 'react';
import useMetricsStore from '../store/metricsStore';
import { metricsService } from '../services/metrics.service';
import { getLocalCache, setLocalCache, CACHE_KEYS } from '../services/localCache';

export function useMetrics() {
  const {
    metrics,
    latestMetrics,
    statistics,
    loading,
    setMetrics,
    setLatestMetrics,
    setStatistics,
    setLoading,
  } = useMetricsStore();

  const fetchMetrics = useCallback(async (measurementType, days = 7) => {
    // Nếu store chưa có số đo, nạp nhanh từ IndexedDB để không bị màn hình chờ
    if (!metrics || metrics.length === 0) {
      const cached = await getLocalCache(CACHE_KEYS.METRICS_LIST, []);
      if (cached && cached.length > 0) {
        setMetrics(cached);
      } else {
        setLoading(true);
      }
    }
    try {
      const res = await metricsService.getMetrics(measurementType, days);
      const list = res.data?.data || res.data || [];
      setMetrics(list);
      // Nếu là danh sách tổng hợp (không lọc riêng loại đo), lưu làm bản cache chuẩn
      if (!measurementType) {
        setLocalCache(CACHE_KEYS.METRICS_LIST, list);
      }
    } catch (err) {
      console.warn('[useMetrics] Lỗi nạp chỉ số từ server, giữ bản cache:', err);
    } finally {
      setLoading(false);
    }
  }, [metrics, setMetrics, setLoading]);

  const fetchLatest = useCallback(async () => {
    if (!latestMetrics) {
      const cached = await getLocalCache(CACHE_KEYS.LATEST_METRICS, null);
      if (cached) setLatestMetrics(cached);
    }
    try {
      const res = await metricsService.getLatest();
      const data = res.data?.data || res.data;
      setLatestMetrics(data);
      if (data) setLocalCache(CACHE_KEYS.LATEST_METRICS, data);
    } catch (err) {
      console.warn('[useMetrics] Lỗi nạp chỉ số mới nhất từ server, giữ bản cache:', err);
    }
  }, [latestMetrics, setLatestMetrics]);

  const fetchStatistics = useCallback(async (measurementType, days = 90) => {
    setLoading(true);
    try {
      const res = await metricsService.getStatistics(measurementType, days);
      setStatistics(res.data?.data || res.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [setStatistics, setLoading]);

  const addMetric = async (data) => {
    const res = await metricsService.create(data);
    return res.data?.data || res.data;
  };

  const removeMetric = async (id) => {
    await metricsService.delete(id);
  };

  return {
    metrics,
    latestMetrics,
    statistics,
    loading,
    fetchMetrics,
    fetchLatest,
    fetchStatistics,
    addMetric,
    removeMetric,
  };
}
