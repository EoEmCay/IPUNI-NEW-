import { create } from 'zustand';
import vi from '../i18n/vi';
import en from '../i18n/en';
import lo from '../i18n/lo';

const TRANSLATIONS = { vi, en, lo };
const LANG_KEY = 'diaplus-lang';

const getSavedLang = () => {
  return 'vi'; // Force Vietnamese
};

const useLangStore = create((set) => ({
  lang: 'vi',
  t: vi,

  setLang: (lang) => {
    // Ignore setting other languages
    localStorage.setItem(LANG_KEY, 'vi');
    set({ lang: 'vi', t: vi });
  },
}));

export default useLangStore;
