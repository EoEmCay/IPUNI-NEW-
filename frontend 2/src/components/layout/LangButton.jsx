import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useLangStore from '../../store/langStore';
import styles from './LangButton.module.css';

const LANGS = [
  { code: 'vi', emoji: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', emoji: '🇬🇧', label: 'English' },
  { code: 'lo', emoji: '🇱🇦', label: 'ພາສາລາວ' },
];

export default function LangButton() {
  const { lang, setLang } = useLangStore();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  const handleSelect = (code) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        className={styles.btn}
        onClick={handleToggle}
        title={current.label}
        style={{ fontSize: 20 }}
      >
        {current.emoji}
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className={styles.dropdown}
          style={{ top: pos.top, right: pos.right }}
        >
          {LANGS.map(({ code, emoji, label }) => (
            <button
              key={code}
              className={`${styles.option} ${lang === code ? styles.optionActive : ''}`}
              onClick={() => handleSelect(code)}
            >
              <span style={{ fontSize: 18, marginRight: 8 }}>{emoji}</span>
              <span className={styles.optionLabel}>{label}</span>
              {lang === code && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
