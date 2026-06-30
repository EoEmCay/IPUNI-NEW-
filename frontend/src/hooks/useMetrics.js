import { useCallback } from 'react';
import useMetricsStore from '../store/metricsStore';
import { metricsService } from '../services/metrics.service';

export function useMetrics() {
  const { metrics, latestMetrics, statistics, loading, setMetrics, setLatestMetrics, setStatistics, setLoading } = useMetricsStore();

  const fetchMetrics = useCallback(async (measurementType, days = 7) => {
    setLoading(true);
    try {
      const res = await metricsService.getMetrics(measurementType, days);
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [setMetrics, setLoading]);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await metricsService.getLatest();
      setLatestMetrics(res.data.data);
    } catch (err) {
      console.error('Error fetching latest metrics:', err);
    }
  }, [setLatestMetrics]);

  const fetchStatistics = useCallback(async (measurementType, days = 90) => {
    setLoading(true);
    try {
      const res = await metricsService.getStatistics(measurementType, days);
      setStatistics(res.data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [setStatistics, setLoading]);

  const addMetric = async (data) => {
    const res = await metricsService.create(data);
    return res.data.data;
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
    removeMetric
  };
}
