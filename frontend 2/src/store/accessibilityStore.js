import { create } from 'zustand';

const SCALE_KEY = 'diaplus-font-scale';

// Mức 1x–4x -> hệ số phóng to thực tế (vừa phải để không vỡ layout 430px)
export const SCALE_FACTORS = { 1: 1, 2: 1.15, 3: 1.3, 4: 1.5 };

function getStoredLevel() {
  const v = parseInt(localStorage.getItem(SCALE_KEY), 10);
  return v >= 1 && v <= 4 ? v : 1;
}

function applyScale(level) {
  const factor = SCALE_FACTORS[level] || 1;
  // zoom phóng to + reflow theo bề rộng viewport nên không tràn ngang
  document.documentElement.style.zoom = factor;
  localStorage.setItem(SCALE_KEY, String(level));
}

const useAccessibilityStore = create((set) => {
  const level = getStoredLevel();
  applyScale(level);

  return {
    fontScale: level,
    setFontScale: (level) =>
      set(() => {
        const clamped = Math.min(4, Math.max(1, level));
        applyScale(clamped);
        return { fontScale: clamped };
      }),
  };
});

export default useAccessibilityStore;
