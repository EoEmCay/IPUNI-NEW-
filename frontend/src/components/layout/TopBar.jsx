import { Activity, Bell, Sparkles } from 'lucide-react';
import UserMenu from './UserMenu';
import useThemeStore from '../../store/themeStore';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { isCuteMode } = useThemeStore();

  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        {isCuteMode
          ? <Sparkles size={22} color="#fff" strokeWidth={2.5} />
          : <Activity size={22} color="#fff" strokeWidth={2.5} />
        }
        <span className={styles.logoText}>IPUNI</span>
        {isCuteMode && <span className={styles.cuteBadge}>cute</span>}
      </div>
      <div className={styles.actions}>
        <button className={styles.bellBtn} title="Thông báo">
          <Bell size={20} />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
