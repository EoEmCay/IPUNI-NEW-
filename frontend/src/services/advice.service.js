import api from './api';

export const adviceService = {
  getAll: (category) => api.get('/advice', { params: { category } }),
  getById: (id) => api.get(`/advice/${id}`),
  analyzeMeal: (payload) => api.post('/advice/analyze-meal', payload),
};
