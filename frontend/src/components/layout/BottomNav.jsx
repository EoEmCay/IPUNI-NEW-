import { NavLink } from 'react-router-dom';
import { Home, Activity, Users, MessageCircle, User } from 'lucide-react';
import styles from './BottomNav.module.css';

// Giao diện mới 10/2026: 5 tab. Quét đơn nay là ô "Quét AI" đầu tiên ở Trang chủ.
const ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Trang chủ', exact: true },
  { to: '/glucose', icon: Activity, label: 'Chỉ số' },
  { to: '/family', icon: Users, label: 'Gia đình' },
  { to: '/messages', icon: MessageCircle, label: 'Tin nhắn' },
  { to: '/profile', icon: User, label: 'Hồ sơ' },
];

export default function BottomNav() {
  return (
    <nav className={`${styles.nav} tour-nav`} aria-label="Điều hướng chính">
      {ITEMS.map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <Icon size={22} strokeWidth={1.9} />
          </div>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
