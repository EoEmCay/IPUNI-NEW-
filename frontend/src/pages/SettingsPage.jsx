import { ZoomIn } from 'lucide-react';
import useAccessibilityStore from '../store/accessibilityStore';
import { useT } from '../hooks/useT';
import UpgradeCard from '../components/settings/UpgradeCard';
import ZaloReminderCard from '../components/settings/ZaloReminderCard';
import styles from './SettingsPage.module.css';
import PageHeader from '../components/common/PageHeader';

const ZOOM_LEVELS = [
  { label: '1x', scale: 1 },
  { label: '2x', scale: 1.1 },
  { label: '3x', scale: 1.2 },
  { label: '4x', scale: 1.3 },
];

// Cài đặt chung (mở từ menu avatar). Ghi âm giọng nói nằm ở trang "Giọng nhắc".
export default function SettingsPage() {
  const { fontScale, setFontScale } = useAccessibilityStore();
  const t = useT();
  const s = t.settings;

  return (
    <div className={styles.page}>
      <PageHeader title={s.title} />

      <section className={styles.settingsCard} aria-labelledby="font-size-title">
        <div className={styles.settingRow}>
          <span className={styles.settingIcon}><ZoomIn size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="font-size-title" className={styles.settingTitle}>{s.fontSizeTitle}</h2>
            <p className={styles.settingDesc}>{s.fontSizeDesc}</p>
          </div>
        </div>
        <div className={styles.zoomRow}>
          {ZOOM_LEVELS.map(({ label, scale }) => (
            <button
              key={label}
              type="button"
              className={`${styles.zoomBtn} ${fontScale === scale ? styles.zoomActive : ''}`}
              onClick={() => setFontScale(scale)}
              aria-pressed={fontScale === scale}
              aria-label={`${s.zoomLevel} ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <ZaloReminderCard />
      <UpgradeCard />

      <p className={styles.version}>{s.version}</p>
    </div>
  );
}
