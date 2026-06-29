import { useEffect } from 'react';
import useThemeStore from '../../store/themeStore';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import VoiceAlertEngine from '../common/VoiceAlertEngine';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const restoreTheme = useThemeStore((s) => s.restoreTheme);

  // Vào trong app: khôi phục giao diện người dùng đã chọn (cute/gold/default)
  useEffect(() => { restoreTheme(); }, [restoreTheme]);

  return (
    <div className={styles.layout}>
      <TopBar />
      <main className="page-content">
        {children}
      </main>
      <VoiceAlertEngine />
      <BottomNav />
    </div>
  );
}
