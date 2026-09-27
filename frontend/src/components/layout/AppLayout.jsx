import { useEffect } from 'react';
import useThemeStore from '../../store/themeStore';
import useAccessibilityStore from '../../store/accessibilityStore';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import VoiceAlertEngine from '../common/VoiceAlertEngine';
import OnboardingTour from '../common/OnboardingTour';
import FamilyAlertWatcher from './FamilyAlertWatcher';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const restoreTheme = useThemeStore((s) => s.restoreTheme);
  const fontScale = useAccessibilityStore((s) => s.fontScale);

  // Vào trong app: khôi phục giao diện người dùng đã chọn (xanh–trắng / gold)
  useEffect(() => { restoreTheme(); }, [restoreTheme]);

  return (
    <div className={styles.layout}>
      <TopBar />
      <main className="page-content" style={{ zoom: fontScale }}>
        {children}
      </main>
      <BottomNav />
      <VoiceAlertEngine />
      <OnboardingTour />
      <FamilyAlertWatcher />
    </div>
  );
}
