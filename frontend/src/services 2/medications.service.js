import api from './api';

export const medicationsService = {
  getAll: () => api.get('/medications'),
  getToday: () => api.get('/medications/today'),
  create: (data) => api.post('/medications', data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
};
