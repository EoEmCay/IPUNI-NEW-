import { create } from 'zustand';

const THEME_KEY = 'diaplus-theme';
const GOLD_UNLOCK_KEY = 'diaplus-gold-unlocked';
// Mã nâng gói / mã đối tác mở khoá giao diện Gold.
// ponytail: kiểm tra ở client - chỉ là giao diện, không mở quyền truy cập dữ liệu nào.
const GOLD_CODES = ['doitacDIA+', 'donghanhDIA+'];

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* bộ nhớ trình duyệt bị chặn */ } };

export const isGoldUnlocked = () => read(GOLD_UNLOCK_KEY) === '1';

// Chỉ còn 2 giao diện: xanh–trắng (mặc định) và Gold. Giá trị cũ như 'cute' -> mặc định.
function getStoredTheme() {
  return read(THEME_KEY) === 'gold' && isGoldUnlocked() ? 'gold' : 'default';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'gold' ? 'gold' : '');
  // Màu thanh trình duyệt/thanh trạng thái điện thoại khớp đầu trang của giao diện đang dùng
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
        const theme = next === 'gold' && isGoldUnlocked() ? 'gold' : 'default';
        applyTheme(theme);
        return { theme, isGoldMode: theme === 'gold' };
      }),

    // Trả về true nếu mã đúng (mở khoá vĩnh viễn trên máy này)
    unlockGold: (code) => {
      if (!GOLD_CODES.includes(String(code || '').trim())) return false;
      write(GOLD_UNLOCK_KEY, '1');
      return true;
    },

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
