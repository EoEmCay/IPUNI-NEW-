import api from './api';

export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (cccd, phone, password) => api.post('/auth/register', { cccd, phone, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};
