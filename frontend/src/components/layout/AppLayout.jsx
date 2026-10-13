import { useEffect } from 'react';
import useThemeStore from '../../store/themeStore';
import useAccessibilityStore from '../../store/accessibilityStore';
import useRoleModeStore from '../../store/roleModeStore';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import VoiceAlertEngine from '../common/VoiceAlertEngine';
import OnboardingTour from '../common/OnboardingTour';
import FamilyAlertWatcher from './FamilyAlertWatcher';
import styles from './AppLayout.module.css';

// bare: trang tự dựng header riêng (Trang chủ mới, hoặc chế độ Người Giám Sát) -> không hiện TopBar trôi lửng lơ.
export default function AppLayout({ children, bare = false }) {
  const restoreTheme = useThemeStore((s) => s.restoreTheme);
  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const deviceMode = useRoleModeStore((s) => s.deviceMode);

  // Vào trong app: khôi phục giao diện người dùng đã chọn (xanh–trắng / gold)
  useEffect(() => { restoreTheme(); }, [restoreTheme]);

  const isSupervisor = roleMode === 'supervisor';
  const isCaregiver = roleMode === 'caregiver';
  const isPcSupervisor = isSupervisor && deviceMode === 'pc';
  // Bare áp dụng cho role Patient ở các trang có header riêng (như /dashboard), hoặc Supervisor.
  // Riêng Hộ lý (Caregiver), tab Nhiệm vụ (/dashboard) cần hiện TopBar (DIA+, nhiệt độ, thời gian) ở trên cùng.
  const effectiveBare = (bare && !isCaregiver) || isSupervisor;

  return (
    <div className={`${styles.layout} ${isPcSupervisor ? styles.pcLayout : ''}`}>
      <main className={`page-content ${effectiveBare ? 'page-content--bare' : ''}`} style={{ zoom: fontScale }}>
        {!effectiveBare && <TopBar />}
        {children}
      </main>
      <BottomNav />
      <VoiceAlertEngine />
      <OnboardingTour />
      <FamilyAlertWatcher />
    </div>
  );
}
