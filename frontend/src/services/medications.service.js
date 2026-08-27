import api from './api';
import { cachedGet, invalidate } from './httpCache';

const bust = () => invalidate('/medications');

export const medicationsService = {
  getAll: () => cachedGet(api, '/medications', {}, 120_000),
  getToday: () => cachedGet(api, '/medications/today', {}, 120_000),
  create: async (data) => { const r = await api.post('/medications', data); bust(); return r; },
  update: async (id, data) => { const r = await api.put(`/medications/${id}`, data); bust(); return r; },
  delete: async (id) => { const r = await api.delete(`/medications/${id}`); bust(); return r; },

  // Tuân thủ thuốc + nhật ký liều
  getAdherence: (days = 30) => cachedGet(api, '/medications/adherence', { params: { days } }, 60_000),
  getLogs: (days = 30) => cachedGet(api, '/medications/logs', { params: { days } }, 60_000),
  logDose: async (id, body) => {
    const r = await api.post(`/medications/${id}/logs`, body);
    invalidate('/medications/adherence');
    invalidate('/medications/logs');
    return r;
  },
};
