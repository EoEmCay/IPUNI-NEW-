import { useEffect } from 'react';
import useThemeStore from '../../store/themeStore';
import useAccessibilityStore from '../../store/accessibilityStore';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import VoiceAlertEngine from '../common/VoiceAlertEngine';
import OnboardingTour from '../common/OnboardingTour';
import FamilyAlertWatcher from './FamilyAlertWatcher';
import styles from './AppLayout.module.css';

// bare: trang tự dựng header riêng (Trang chủ mới) -> không hiện thanh trên.
export default function AppLayout({ children, bare = false }) {
  const restoreTheme = useThemeStore((s) => s.restoreTheme);
  const fontScale = useAccessibilityStore((s) => s.fontScale);

  // Vào trong app: khôi phục giao diện người dùng đã chọn (xanh–trắng / gold)
  useEffect(() => { restoreTheme(); }, [restoreTheme]);

  return (
    <div className={styles.layout}>
      {!bare && <TopBar />}
      <main className={`page-content ${bare ? 'page-content--bare' : ''}`} style={{ zoom: fontScale }}>
        {children}
      </main>
      <BottomNav />
      <VoiceAlertEngine />
      <OnboardingTour />
      <FamilyAlertWatcher />
    </div>
  );
}
