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
    const data = res.data.data;

    // Tài khoản đang có thiết bị khác hoạt động -> chờ phê duyệt, chưa có token ngay.
    if (data.status === 'pending') {
      return { pending: true, requestId: data.requestId };
    }

    const { token, user } = data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return { pending: false, user };
  };

  // Gọi lặp lại /auth/login-status cho tới khi có kết quả cuối (approved/rejected/expired)
  // hoặc bị huỷ qua AbortSignal. Trả về user khi được phê duyệt.
  const pollLoginStatus = async (requestId, { signal } = {}) => {
    while (!signal?.aborted) {
      const res = await authService.loginStatus(requestId);
      const data = res.data.data;

      if (data.status === 'approved') {
        setAuth(data.token, data.user);
        applyPlanTheme(data.user.plan);
        return data.user;
      }
      if (data.status === 'rejected') {
        throw { status: 'rejected', message: 'Yêu cầu đăng nhập đã bị từ chối' };
      }
      if (data.status === 'expired') {
        throw { status: 'expired', message: 'Yêu cầu đăng nhập đã hết hạn' };
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw { status: 'cancelled', message: 'Đã huỷ chờ xác nhận' };
  };

  const approveLogin = (requestId) => authService.approveLogin(requestId);
  const rejectLogin = (requestId) => authService.rejectLogin(requestId);
  const getPendingApprovals = () => authService.pendingApprovals();

  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
    const { token, user } = res.data.data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return user;
  };

  const googleLogin = async (accessToken) => {
    const res = await authService.googleLogin(accessToken);
    const data = res.data.data;

    // Tài khoản đang có thiết bị khác hoạt động -> chờ phê duyệt, chưa có token ngay.
    if (data.status === 'pending') {
      return { pending: true, requestId: data.requestId };
    }

    const { token, user } = data;
    setAuth(token, user);
    applyPlanTheme(user.plan);
    return { pending: false, user };
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

  return {
    user, token, isAuthenticated, login, googleLogin, demoLogin, logout, register, updateProfile, completeRegistration,
    pollLoginStatus, approveLogin, rejectLogin, getPendingApprovals, changePassword,
  };
}
