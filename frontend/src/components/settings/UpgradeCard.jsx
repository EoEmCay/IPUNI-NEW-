import { useState } from 'react';
import { Crown, Check } from 'lucide-react';
import useThemeStore, { isGoldUnlocked } from '../../store/themeStore';
import styles from './SettingsCards.module.css';

// "Nâng gói": nhập mã đối tác để dùng giao diện Gold (cùng cơ chế với cửa sổ Giao diện).
export default function UpgradeCard() {
  const { isGoldMode, selectTheme, unlockGold } = useThemeStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [, refresh] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    if (!unlockGold(code)) { setError('Mã không đúng. Vui lòng kiểm tra lại.'); return; }
    selectTheme('gold');
    setCode('');
  };

  return (
    <section className={styles.card} aria-labelledby="upgrade-title">
      <div className={styles.row}>
        <span className={`${styles.icon} ${styles.iconGold}`}><Crown size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="upgrade-title" className={styles.title}>Nâng gói Gold</h2>
          <p className={styles.desc}>Nhập mã để dùng giao diện Gold.</p>
        </div>
      </div>

      {isGoldMode ? (
        <>
          <p className={styles.ok}><Check size={20} aria-hidden="true" /> Bạn đang dùng giao diện Gold</p>
          <button type="button" className={styles.secondary} onClick={() => { selectTheme('default'); refresh((n) => n + 1); }}>
            Về giao diện xanh – trắng
          </button>
        </>
      ) : isGoldUnlocked() ? (
        <button type="button" className={styles.primary} onClick={() => selectTheme('gold')}>Dùng giao diện Gold</button>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <label htmlFor="upgrade-code" className={styles.label}>Mã nâng gói</label>
          <input id="upgrade-code" className={styles.input} value={code} autoComplete="off" autoCapitalize="off"
            onChange={(e) => { setCode(e.target.value); setError(''); }} />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.primary} disabled={!code.trim()}>Nâng gói</button>
        </form>
      )}
    </section>
  );
}
