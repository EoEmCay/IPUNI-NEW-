import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth.service';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      authService.getMe()
        .then((res) => setUser(res.data.data))
        .catch(() => logout());
    }
  }, [token]);

  const login = async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const { token, user } = res.data.data;
    setAuth(token, user);
    return user;
  };

  const register = async (cccd, phone, password) => {
    const res = await authService.register(cccd, phone, password);
    const { token, user } = res.data.data;
    setAuth(token, user);
    return user;
  };

  return { user, token, isAuthenticated, login, logout, register };
}
