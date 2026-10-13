import { create } from 'zustand';

const SCALE_KEY = 'diaplus-font-scale';

function getStoredLevel() {
  const v = parseFloat(localStorage.getItem(SCALE_KEY));
  return !isNaN(v) && v >= 1 && v <= 1.3 ? v : 1;
}

function saveStoredLevel(factor) {
  localStorage.setItem(SCALE_KEY, String(factor));
}

const useAccessibilityStore = create((set) => {
  const level = getStoredLevel();
  
  // Xoá bỏ thuộc tính zoom cũ ở cấp độ document để sửa lỗi văng giao diện trang đăng nhập (do cache cũ)
  if (typeof document !== 'undefined') {
    document.documentElement.style.zoom = '';
  }

  return {
    fontScale: level,
    setFontScale: (level) =>
      set(() => {
        const clamped = Math.min(1.3, Math.max(1, level));
        saveStoredLevel(clamped);
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--font-scale', String(clamped));
        }
        return { fontScale: clamped };
      }),
  };
});

export default useAccessibilityStore;
