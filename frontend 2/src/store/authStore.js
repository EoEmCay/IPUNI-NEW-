import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('diaplus_token') || null,
  isAuthenticated: !!localStorage.getItem('diaplus_token'),

  setAuth: (token, user) => {
    localStorage.setItem('diaplus_token', token);
    set({ token, user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('diaplus_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
