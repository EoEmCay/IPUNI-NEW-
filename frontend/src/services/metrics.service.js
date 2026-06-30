import api from './api';

export const metricsService = {
  getMetrics: (measurementType, days = 7) =>
    api.get('/metrics', {
      params: {
        measurement_type: measurementType,
        days
      }
    }),

  getLatest: () => api.get('/metrics/latest'),

  getStatistics: (measurementType, days = 90) =>
    api.get('/metrics/statistics', {
      params: {
        measurement_type: measurementType,
        days
      }
    }),

  create: (data) => api.post('/metrics', data),

  delete: (id) => api.delete(`/metrics/${id}`)
};
