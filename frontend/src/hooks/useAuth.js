import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { authService } from '../services/auth.service';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore();
  const { applyPlanTheme, resetTheme } = useThemeStore();

  useEffect(() => {
    if (token && !user) {
      authService.getMe()
        .then((res) => {
          setUser(res.data.data);
          applyPlanTheme(res.data.data.plan);
        })
        .catch(() => storeLogout());
    }
  }, [token, user, setUser, applyPlanTheme, storeLogout]);

  const login = async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const { token, user } = res.data.data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return user;
  };

  const googleMockLogin = async (email) => {
    const res = await authService.googleMock(email);
    const { token, user } = res.data.data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return user;
  };

  const demoLogin = async () => {
    const res = await authService.demoLogin();
    const { token, user } = res.data.data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return user;
  };

  const register = async (email, phone, password, confirmPassword, extras = {}) => {
    const res = await authService.register(email, phone, password, confirmPassword, extras);
    const { token, user } = res.data.data;
    return { token, user };
  };

  const completeRegistration = (token, user) => {
    setAuth(token, user);
    applyPlanTheme(user.plan);
  };

  const logout = () => {
    storeLogout();
    resetTheme();
  };

  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    setUser(res.data.data);
    return res.data.data;
  };

  return { user, token, isAuthenticated, login, googleMockLogin, demoLogin, logout, register, updateProfile, completeRegistration };
}
