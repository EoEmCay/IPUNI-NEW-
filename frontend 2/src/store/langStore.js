import { create } from 'zustand';
import vi from '../i18n/vi';
import en from '../i18n/en';
import lo from '../i18n/lo';

const TRANSLATIONS = { vi, en, lo };
const LANG_KEY = 'diaplus-lang';

const useLangStore = create((set) => ({
  lang: localStorage.getItem(LANG_KEY) || 'vi',
  t: TRANSLATIONS[localStorage.getItem(LANG_KEY) || 'vi'],

  setLang: (lang) => {
    localStorage.setItem(LANG_KEY, lang);
    set({ lang, t: TRANSLATIONS[lang] });
  },
}));

export default useLangStore;
