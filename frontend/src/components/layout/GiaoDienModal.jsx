import { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import Modal from '../common/Modal';
import useThemeStore, { isGoldUnlocked } from '../../store/themeStore';
import styles from './GiaoDienModal.module.css';

const THEMES = [
  { key: 'default', name: 'Xanh – trắng', desc: 'Giao diện tiêu chuẩn', bg: 'linear-gradient(135deg,#0F766E,#14B8A6)' },
  { key: 'gold', name: 'Gold', desc: 'Dành cho đối tác', bg: 'linear-gradient(135deg,#9A6B00,#C9921A 50%,#F0C040)' },
];

export default function GiaoDienModal({ onClose }) {
  const { theme, selectTheme, unlockGold } = useThemeStore();
  const [askCode, setAskCode] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const choose = (key) => {
    if (key === 'gold' && !isGoldUnlocked()) {
      setAskCode(true);
      return;
    }
    selectTheme(key);
    onClose();
  };

  const submitCode = (e) => {
    e.preventDefault();
    if (!unlockGold(code)) {
      setError('Mã không đúng. Vui lòng kiểm tra lại mã đối tác.');
      return;
    }
    selectTheme('gold');
    onClose();
  };

  return (
    <Modal title="Giao diện" onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {THEMES.map((item) => {
            const active = theme === item.key;
            const locked = item.key === 'gold' && !isGoldUnlocked();
            return (
              <button
                type="button"
                key={item.key}
                className={`${styles.card} ${active ? styles.cardActive : ''}`}
                onClick={() => choose(item.key)}
              >
                <span className={styles.preview} style={{ background: item.bg }}>
                  {active && (
                    <span className={styles.checkWrap}>
                      <Check size={16} color="white" strokeWidth={3} />
                    </span>
                  )}
                  {locked && <Lock size={22} className={styles.lockIcon} />}
                </span>
                <span className={styles.styleName}>{item.name}</span>
                <span className={styles.styleDesc}>{active ? '✓ Đang dùng' : locked ? 'Cần mã đối tác' : item.desc}</span>
              </button>
            );
          })}
        </div>

        {askCode && (
          <form className={styles.codeForm} onSubmit={submitCode}>
            <label htmlFor="gold-code" className={styles.codeLabel}>Nhập mã đối tác để dùng giao diện Gold</label>
            <input
              id="gold-code"
              className={styles.codeInput}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              autoComplete="off"
              autoCapitalize="off"
              autoFocus
            />
            {error && <p className={styles.codeError}>{error}</p>}
            <button type="submit" className={styles.codeBtn} disabled={!code.trim()}>Mở khoá Gold</button>
          </form>
        )}
      </div>
    </Modal>
  );
}
