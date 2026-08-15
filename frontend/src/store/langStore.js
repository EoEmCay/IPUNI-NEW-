import { create } from 'zustand';
import vi from '../i18n/vi';

const LANG_KEY = 'diaplus-lang';

const useLangStore = create((set) => ({
  lang: 'vi',
  t: vi,

  setLang: () => {
    // Ignore setting other languages
    localStorage.setItem(LANG_KEY, 'vi');
    set({ lang: 'vi', t: vi });
  },
}));

export default useLangStore;
