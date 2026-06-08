import { NavLink } from 'react-router-dom';
import { Home, Activity, Pill, Calendar, BookOpen } from 'lucide-react';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Tổng quan', exact: true },
  { to: '/metrics', icon: Activity, label: 'Chỉ số' },
  { to: '/medications', icon: Pill, label: 'Thuốc' },
  { to: '/appointments', icon: Calendar, label: 'Lịch hẹn' },
  { to: '/advice', icon: BookOpen, label: 'Lời khuyên' },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
