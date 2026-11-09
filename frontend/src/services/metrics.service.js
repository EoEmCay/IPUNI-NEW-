import api from './api';
import { cachedGet, invalidate } from './httpCache';

export const metricsService = {
  getMetrics: (measurementType, days = 7) =>
    cachedGet(api, '/metrics', {
      params: {
        measurement_type: measurementType,
        days,
      },
    }, 30_000),

  getLatest: () => cachedGet(api, '/metrics/latest', {}, 30_000),

  getStatistics: (measurementType, days = 90) =>
    cachedGet(api, '/metrics/statistics', {
      params: {
        measurement_type: measurementType,
        days,
      },
    }, 60_000),

  create: async (data) => {
    const r = await api.post('/metrics', data);
    invalidate('/metrics');
    invalidate('/care');
    return r;
  },

  delete: async (id) => {
    const r = await api.delete(`/metrics/${id}`);
    invalidate('/metrics');
    invalidate('/care');
    return r;
  },
};
