import { Palette, Sparkles, Crown, Lock, Check } from 'lucide-react';
import Modal from '../common/Modal';
import useThemeStore from '../../store/themeStore';
import styles from './GiaoDienModal.module.css';

const STYLE_PACKS = [
  { key: 'gold',    name: 'Gold',     desc: 'Giao diện cao cấp Pro',  unlocked: true,  bg: 'linear-gradient(135deg,#9A6B00,#C9921A 50%,#F0C040)' },
  { key: 'default', name: 'Default',  desc: 'Giao diện tiêu chuẩn',  unlocked: true,  bg: 'linear-gradient(135deg,#1B5FA6,#3B82F6)' },
  { key: 'cute',    name: 'Cute',     desc: 'Pastel & dễ thương',     unlocked: true,  bg: 'linear-gradient(135deg,#A855F7,#EC4899)' },
  { key: 'midnight',name: 'Midnight', desc: 'Sắp ra mắt',            unlocked: false, bg: 'linear-gradient(135deg,#1E1B4B,#6366F1)' },
  { key: 'ocean',   name: 'Ocean',    desc: 'Sắp ra mắt',            unlocked: false, bg: 'linear-gradient(135deg,#0369A1,#0EA5E9)' },
  { key: 'rose',    name: 'Rose',     desc: 'Sắp ra mắt',            unlocked: false, bg: 'linear-gradient(135deg,#BE123C,#F43F5E)' },
];

export default function GiaoDienModal({ onClose }) {
  const { theme, selectTheme } = useThemeStore();

  const handleSelect = (pack) => {
    if (!pack.unlocked) return;
    selectTheme(pack.key);
    onClose();
  };

  return (
    <Modal title="Giao Diện" onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.proHeader}>
          <Crown size={14} fill="#C9921A" color="#C9921A" />
          <span>A-Styles — Độc quyền tài khoản Pro</span>
        </div>

        <p className={styles.desc}>Chọn giao diện yêu thích. Nhiều style sẽ được mở khóa sắp tới.</p>

        <div className={styles.grid}>
          {STYLE_PACKS.map((s) => {
            const active = theme === s.key;
            return (
              <div
                key={s.key}
                className={`${styles.card} ${active ? styles.cardActive : ''} ${!s.unlocked ? styles.cardLocked : ''}`}
                onClick={() => handleSelect(s)}
              >
                <div className={styles.preview} style={{ background: s.bg }}>
                  {active && (
                    <span className={styles.checkWrap}>
                      <Check size={16} color="white" strokeWidth={3} />
                    </span>
                  )}
                  {!s.unlocked && <Lock size={16} className={styles.lockIcon} />}
                </div>
                <p className={styles.styleName}>{s.name}</p>
                <p className={styles.styleDesc}>{active ? '✓ Đang dùng' : s.desc}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.sectionTitle}>
            <Sparkles size={14} color="#C9921A" />
            <span>Khung Avatar — 100+ mẫu</span>
            <span className={styles.comingSoon}>Sắp ra mắt</span>
          </div>
          <div className={styles.avatarGrid}>
            {['🌟', '👑', '💎', '🔥', '⚡', '🌸'].map((emoji, i) => (
              <div key={i} className={`${styles.avatarFrame} ${i > 1 ? styles.avatarLocked : ''}`}>
                <span>{emoji}</span>
                {i > 1 && <Lock size={10} className={styles.avatarLockIcon} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
