import { useCallback } from 'react';
import useMetricsStore from '../store/metricsStore';
import { metricsService } from '../services/metrics.service';

export function useMetrics() {
  const { metrics, latestMetrics, loading, setMetrics, setLatestMetrics, setLoading } = useMetricsStore();

  const fetchMetrics = useCallback(async (type, days = 7) => {
    setLoading(true);
    try {
      const res = await metricsService.getMetrics(type, days);
      setMetrics(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await metricsService.getLatest();
      setLatestMetrics(res.data.data);
    } catch {}
  }, []);

  const addMetric = async (data) => {
    const res = await metricsService.create(data);
    return res.data.data;
  };

  const removeMetric = async (id) => {
    await metricsService.delete(id);
  };

  return { metrics, latestMetrics, loading, fetchMetrics, fetchLatest, addMetric, removeMetric };
}
