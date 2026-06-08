import api from './api';

export const metricsService = {
  getMetrics: (type, days) => api.get('/metrics', { params: { type, days } }),
  getLatest: () => api.get('/metrics/latest'),
  create: (data) => api.post('/metrics', data),
  delete: (id) => api.delete(`/metrics/${id}`),
};
