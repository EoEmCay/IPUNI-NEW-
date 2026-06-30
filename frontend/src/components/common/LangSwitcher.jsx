import useLangStore from '../../store/langStore';
import styles from './LangSwitcher.module.css';

const LANGS = [
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'lo', flag: '🇱🇦', label: 'ພາສາລາວ' },
];

export default function LangSwitcher() {
  const { lang, setLang } = useLangStore();

  return (
    <div className={styles.wrap}>
      {LANGS.map(({ code, flag, label }) => (
        <button
          key={code}
          className={`${styles.flagBtn} ${lang === code ? styles.active : ''}`}
          onClick={() => setLang(code)}
          title={label}
        >
          <span className={styles.flag}>{flag}</span>
        </button>
      ))}
    </div>
  );
}
