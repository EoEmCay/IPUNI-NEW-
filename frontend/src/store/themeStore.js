import { create } from 'zustand';

const THEME_KEY = 'diaplus-theme';

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* bộ nhớ trình duyệt bị chặn */ } };

// Mở khóa đầy đủ tất cả giao diện và tính năng ngay khi sử dụng app (không cần mã đối tác).
export const isGoldUnlocked = () => true;

function getStoredTheme() {
  return read(THEME_KEY) === 'gold' ? 'gold' : 'default';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'gold' ? 'gold' : '');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'gold' ? '#FFF1C9' : '#E0F6FC');
  write(THEME_KEY, theme);
}

const useThemeStore = create((set) => {
  const theme = getStoredTheme();
  applyTheme(theme);

  return {
    theme,
    isGoldMode: theme === 'gold',

    selectTheme: (next) =>
      set(() => {
        const theme = next === 'gold' ? 'gold' : 'default';
        applyTheme(theme);
        return { theme, isGoldMode: theme === 'gold' };
      }),

    unlockGold: () => true,

    // Trang đăng nhập/đăng ký: luôn hiển thị giao diện mặc định (không xoá lựa chọn đã lưu).
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
