import NotificationBell from './NotificationBell';
import Logo from '../common/Logo';
import DayChip from '../common/DayChip';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './TopBar.module.css';

const BELL_CSS = { btn: styles.bellBtn, hasBadge: styles.hasBadge, active: styles.active, badge: styles.badge };

// Thanh trên các trang (trừ Trang chủ): DIA+ · buổi/ngày/nhiệt độ · chuông. Nền trong suốt theo
// trang (bỏ dải màu cũ). Đồng hồ demo chỉ hiện ở Trang chủ; cài đặt/đăng xuất nằm ở tab Hồ sơ.
export default function TopBar() {
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const showBell = roleMode === 'patient';

  return (
    <header className={styles.topbar}>
      <Logo size="sm" variant="onLight" />
      <DayChip />
      {showBell ? (
        <NotificationBell css={BELL_CSS} />
      ) : (
        <div className={styles.bellPlaceholder} aria-hidden="true" />
      )}
    </header>
  );
}
