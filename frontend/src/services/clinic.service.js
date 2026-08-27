import api from './api';
import { cachedGet, invalidate } from './httpCache';

export const clinicService = {
  getPatients: (includeVirtual = false) =>
    cachedGet(api, '/clinic/patients', { params: { includeVirtual } }, 15_000),
  getPatient: (id, days = 30) =>
    cachedGet(api, `/clinic/patients/${id}`, { params: { days } }, 15_000),
  ackAlert: async (alertId) => {
    const r = await api.post(`/clinic/alerts/${alertId}/ack`);
    invalidate('/clinic/');
    return r;
  },
  refresh: () => invalidate('/clinic/'),
};
