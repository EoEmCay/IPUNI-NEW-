import { create } from 'zustand';
import { updateTokenCache } from '../services/api';
import { clearHttpCache } from '../services/httpCache';
import { clearAllLocalCache } from '../services/localCache';

const useAuthStore = create((set) => ({
  user: null,
  token: typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('diaplus_token') : null,
  isAuthenticated: !!(typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('diaplus_token')),

  setAuth: (token, user) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('diaplus_token', token);
    }
    updateTokenCache(token);
    set({ token, user, isAuthenticated: true });
  },

  setToken: (token) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('diaplus_token', token);
    }
    updateTokenCache(token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('diaplus_token');
    }
    updateTokenCache(null);
    clearHttpCache();
    clearAllLocalCache().catch(() => {});
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
