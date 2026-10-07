import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import Logo from '../common/Logo';
import DemoCountdown from '../common/DemoCountdown';
import styles from './TopBar.module.css';

const BELL_CSS = { btn: styles.bellBtn, hasBadge: styles.hasBadge, active: styles.active, badge: styles.badge };

export default function TopBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        <Logo size="sm" variant="onDark" />
      </div>

      <DemoCountdown />

      <div className={styles.actions}>
        <NotificationBell css={BELL_CSS} />
        <UserMenu />
      </div>
    </header>
  );
}
