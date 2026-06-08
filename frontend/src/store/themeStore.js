import { create } from 'zustand';

const isCuteMode = () => localStorage.getItem('ipuni-theme') === 'cute';

const applyTheme = (cute) => {
  document.documentElement.setAttribute('data-theme', cute ? 'cute' : 'default');
  localStorage.setItem('ipuni-theme', cute ? 'cute' : 'default');
};

const useThemeStore = create((set) => {
  const cute = isCuteMode();
  applyTheme(cute);

  return {
    isCuteMode: cute,
    toggleCuteMode: () =>
      set((state) => {
        const next = !state.isCuteMode;
        applyTheme(next);
        return { isCuteMode: next };
      }),
  };
});

export default useThemeStore;
