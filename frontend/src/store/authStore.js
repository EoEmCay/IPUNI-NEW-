import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('ipuni_token') || null,
  isAuthenticated: !!localStorage.getItem('ipuni_token'),

  setAuth: (token, user) => {
    localStorage.setItem('ipuni_token', token);
    set({ token, user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('ipuni_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
