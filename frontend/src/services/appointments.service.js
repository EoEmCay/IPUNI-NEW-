import api from './api';

export const appointmentsService = {
  getAll: (status) => api.get('/appointments', { params: { status } }),
  getDoctorNotes: () => api.get('/appointments/doctor-notes'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};
