import { NavLink } from 'react-router-dom';
import { Home, Activity, Pill, Stethoscope, Camera } from 'lucide-react';
import { useT } from '../../hooks/useT';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const t = useT();

  const LEFT_ITEMS = [
    { to: '/dashboard', icon: Home, label: t.nav.home, exact: true },
    { to: '/metrics', icon: Activity, label: t.nav.metrics },
  ];

  const RIGHT_ITEMS = [
    { to: '/medications', icon: Pill, label: t.nav.medications },
    { to: '/appointments', icon: Stethoscope, label: t.nav.appointments },
  ];

  return (
    <nav className={styles.nav}>
      {LEFT_ITEMS.map(({ to, icon: Icon, label, exact }) => (
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

      <NavLink
        to="/scan"
        className={({ isActive }) => `${styles.scanItem} ${isActive ? styles.scanActive : ''}`}
      >
        <div className={styles.scanIconWrap}>
          <Camera size={26} strokeWidth={2} color="#fff" />
        </div>
        <span className={styles.scanLabel}>{t.nav.scan}</span>
      </NavLink>

      {RIGHT_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
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
