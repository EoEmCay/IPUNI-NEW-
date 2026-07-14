import { create } from 'zustand';
import vi from '../i18n/vi';
import en from '../i18n/en';
import lo from '../i18n/lo';

const TRANSLATIONS = { vi, en, lo };
const LANG_KEY = 'diaplus-lang';

const getSavedLang = () => {
  const lang = localStorage.getItem(LANG_KEY) || 'vi';
  return TRANSLATIONS[lang] ? lang : 'vi';
};

const useLangStore = create((set) => ({
  lang: getSavedLang(),
  t: TRANSLATIONS[getSavedLang()],

  setLang: (lang) => {
    const validLang = TRANSLATIONS[lang] ? lang : 'vi';
    localStorage.setItem(LANG_KEY, validLang);
    set({ lang: validLang, t: TRANSLATIONS[validLang] });
  },
}));

export default useLangStore;
