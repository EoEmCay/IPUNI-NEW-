import api from './api';

export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  googleLogin: (accessToken) => api.post('/auth/google-login', { accessToken }),
  register: (email, phone, password, confirmPassword, { name, diagnosis, registrationTicket } = {}) =>
    api.post('/auth/register', { email, phone, password, confirmPassword, name, diagnosis, registrationTicket }),
  demoLogin: () => api.post('/auth/demo-login'),
  sendOtp: (email, password) => api.post('/auth/register-otp', { email, password }),
  verifyOtp: (email, userOtp) => api.post('/auth/verify-otp', { email, userOtp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/users/profile', data),
};
