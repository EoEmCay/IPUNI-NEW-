import { Sparkles, Bell, Shield, HelpCircle, Crown, ZoomIn } from 'lucide-react';
import Modal from '../common/Modal';
import useThemeStore from '../../store/themeStore';
import useAccessibilityStore from '../../store/accessibilityStore';
import { useT } from '../../hooks/useT';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ onClose }) {
  const { isCuteMode, toggleCuteMode, isGoldMode } = useThemeStore();
  const { fontScale, setFontScale } = useAccessibilityStore();
  const t = useT();
  const s = t.settings;

  return (
    <Modal title={s.title} onClose={onClose}>
      <div className={styles.container}>

        <p className={styles.sectionLabel}>{s.sectionDisplay || 'Hiển thị'}</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#EFF6FF' }}>
              <ZoomIn size={18} color="#1B5FA6" />
            </div>
            <div>
              <p className={styles.rowTitle}>{s.fontSizeTitle || 'Cỡ chữ (Phóng to)'}</p>
              <p className={styles.rowDesc}>{s.fontSizeDesc || 'Phóng to toàn bộ chữ để dễ đọc hơn'}</p>
            </div>
          </div>
        </div>

        <div className={styles.scaleRow}>
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              className={`${styles.scaleBtn} ${fontScale === lvl ? styles.scaleBtnActive : ''}`}
              onClick={() => setFontScale(lvl)}
              aria-label={`Phóng to ${lvl}x`}
            >
              {lvl}x
            </button>
          ))}
        </div>

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>{s.sectionTheme}</p>

        {isGoldMode ? (
          <div className={styles.goldThemeRow}>
            <div className={styles.goldThemeIcon}>
              <Crown size={18} fill="#C9921A" color="#C9921A" />
            </div>
            <div>
              <p className={styles.rowTitle}>{s.goldTheme}</p>
              <p className={styles.rowDesc}>{s.goldThemeDesc}</p>
            </div>
          </div>
        ) : (
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.iconWrap} style={{ background: isCuteMode ? '#F5F0FF' : '#FEF3C7' }}>
                <Sparkles size={18} color={isCuteMode ? '#A855F7' : '#D97706'} />
              </div>
              <div>
                <p className={styles.rowTitle}>{s.cuteMode}</p>
                <p className={styles.rowDesc}>{s.cuteModeDesc}</p>
              </div>
            </div>
            <button
              className={`${styles.toggle} ${isCuteMode ? styles.toggleOn : ''}`}
              onClick={toggleCuteMode}
              aria-label="Toggle Cute Mode"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        )}

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>{s.sectionNotify}</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#EFF6FF' }}>
              <Bell size={18} color="#1B5FA6" />
            </div>
            <div>
              <p className={styles.rowTitle}>{s.reminderTitle}</p>
              <p className={styles.rowDesc}>{s.reminderDesc}</p>
            </div>
          </div>
          <div className={styles.comingSoon}>{s.comingSoon}</div>
        </div>

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>{s.sectionOther}</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#F0FDF4' }}>
              <Shield size={18} color="#16A34A" />
            </div>
            <div>
              <p className={styles.rowTitle}>{s.privacy}</p>
              <p className={styles.rowDesc}>{s.privacyDesc}</p>
            </div>
          </div>
          <div className={styles.comingSoon}>{s.comingSoon}</div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#F8F8F8' }}>
              <HelpCircle size={18} color="#6B7A8D" />
            </div>
            <div>
              <p className={styles.rowTitle}>{s.support}</p>
              <p className={styles.rowDesc}>{s.supportDesc}</p>
            </div>
          </div>
          <div className={styles.comingSoon}>{s.comingSoon}</div>
        </div>

        <p className={styles.version}>{s.version}</p>
      </div>
    </Modal>
  );
}
