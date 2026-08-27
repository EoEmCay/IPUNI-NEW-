import { create } from 'zustand';
import { updateTokenCache } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('diaplus_token') || null,
  isAuthenticated: !!localStorage.getItem('diaplus_token'),

  setAuth: (token, user) => {
    localStorage.setItem('diaplus_token', token);
    updateTokenCache(token);
    set({ token, user, isAuthenticated: true });
  },

  setToken: (token) => {
    localStorage.setItem('diaplus_token', token);
    updateTokenCache(token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('diaplus_token');
    localStorage.removeItem('diaplus_patient_active_clinic_session');
    updateTokenCache(null);
    window.dispatchEvent(new CustomEvent('clinicSessionChanged'));
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
