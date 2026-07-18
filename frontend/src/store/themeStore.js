import { create } from 'zustand';

const THEME_KEY = 'diaplus-theme';
const USER_THEME_KEY = 'diaplus-theme-user';
const PRO_THEME_KEY = 'diaplus-pro-theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'default';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'default' ? '' : theme);
  localStorage.setItem(THEME_KEY, theme);
}

const useThemeStore = create((set) => {
  const theme = getStoredTheme();
  applyTheme(theme);

  return {
    theme,
    isCuteMode: theme === 'cute',
    isGoldMode: theme === 'gold',

    toggleCuteMode: () =>
      set((state) => {
        if (state.isGoldMode) return state; // gold overrides cute
        const next = state.isCuteMode ? 'default' : 'cute';
        applyTheme(next);
        localStorage.setItem(USER_THEME_KEY, next);
        return { theme: next, isCuteMode: next === 'cute', isGoldMode: false };
      }),

    applyPlanTheme: (plan) =>
      set((state) => {
        if (plan === 'pro' || plan === 'premium') {
          // Use previously selected Pro theme; default to gold on first login
          const proTheme = localStorage.getItem(PRO_THEME_KEY) || 'gold';
          if (!state.isGoldMode) {
            localStorage.setItem(USER_THEME_KEY, state.theme);
          }
          applyTheme(proTheme);
          return { theme: proTheme, isCuteMode: proTheme === 'cute', isGoldMode: proTheme === 'gold' };
        } else {
          localStorage.removeItem(PRO_THEME_KEY);
          const saved = localStorage.getItem(USER_THEME_KEY) || 'default';
          applyTheme(saved);
          return { theme: saved, isCuteMode: saved === 'cute', isGoldMode: false };
        }
      }),

    // Pro users explicitly select a theme — persists across reloads
    selectTheme: (theme) =>
      set(() => {
        applyTheme(theme);
        localStorage.setItem(PRO_THEME_KEY, theme);
        return { theme, isCuteMode: theme === 'cute', isGoldMode: theme === 'gold' };
      }),

    resetTheme: () =>
      set(() => {
        localStorage.removeItem(PRO_THEME_KEY);
        const saved = localStorage.getItem(USER_THEME_KEY) || 'default';
        applyTheme(saved);
        return { theme: saved, isCuteMode: saved === 'cute', isGoldMode: false };
      }),

    // Trang đăng nhập/đăng ký: luôn hiển thị giao diện mặc định (chỉ đổi giao diện,
    // KHÔNG xoá lựa chọn đã lưu — khi đăng nhập lại sẽ khôi phục).
    applyDefaultLook: () => {
      document.documentElement.setAttribute('data-theme', '');
    },

    // Vào trong app: khôi phục lại giao diện người dùng đã chọn.
    restoreTheme: () =>
      set((state) => {
        applyTheme(state.theme);
        return {};
      }),
  };
});

export default useThemeStore;
