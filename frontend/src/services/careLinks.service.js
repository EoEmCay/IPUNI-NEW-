import api from './api';
import { cachedGet, invalidate } from './httpCache';

export const careLinksService = {
  getFamily: () => cachedGet(api, '/care-links', {}, 30_000),
  saveFamily: async (data) => {
    const r = await api.post('/care-links', data);
    invalidate('/care-links');
    return r;
  },
  // Gia đình liên kết bằng mã tài khoản
  getFamilyMembers: () => api.get('/care-links/family/members'),
  joinFamily: (code) => api.post('/care-links/family/join', { code }),
  leaveFamily: (memberId) => api.delete(`/care-links/family/members/${memberId}`),
  getFamilyAlerts: () => api.get('/care-links/family/alerts'),
  ackFamilyAlert: (alertId) => api.post(`/care-links/family/alerts/${alertId}/ack`),
  sendSos: () => api.post('/care-links/sos'),
};
