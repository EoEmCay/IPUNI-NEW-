import api from './api';
import { cachedGet, invalidate } from './httpCache';

export const careLinksService = {
  getFamily: () => cachedGet(api, '/care-links', {}, 30_000),
  saveFamily: async (data) => {
    const r = await api.post('/care-links', data);
    invalidate('/care-links');
    return r;
  },
};
