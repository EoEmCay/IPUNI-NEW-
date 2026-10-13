import { Check } from 'lucide-react';
import Modal from '../common/Modal';
import useThemeStore from '../../store/themeStore';
import styles from './GiaoDienModal.module.css';

const THEMES = [
  { key: 'default', name: 'Xanh – trắng', desc: 'Giao diện tiêu chuẩn', bg: 'linear-gradient(135deg,#0F766E,#14B8A6)' },
  { key: 'gold', name: 'Gold', desc: 'Giao diện vàng ấm', bg: 'linear-gradient(135deg,#9A6B00,#C9921A 50%,#F0C040)' },
];

export default function GiaoDienModal({ onClose }) {
  const { theme, selectTheme } = useThemeStore();

  const choose = (key) => {
    selectTheme(key);
    onClose();
  };

  return (
    <Modal title="Giao diện" onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {THEMES.map((item) => {
            const active = theme === item.key;
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
                </span>
                <span className={styles.styleName}>{item.name}</span>
                <span className={styles.styleDesc}>{active ? '✓ Đang dùng' : item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
