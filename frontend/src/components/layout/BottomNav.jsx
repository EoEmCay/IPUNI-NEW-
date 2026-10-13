import { NavLink } from 'react-router-dom';
import { Home, Activity, Users, MessageCircle, User, Pill, ClipboardList } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './BottomNav.module.css';

// Chế độ Người bệnh (Bố/Mẹ): 5 tab chuẩn
const PATIENT_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Trang chủ', exact: true },
  { to: '/glucose', icon: Activity, label: 'Chỉ số' },
  { to: '/family', icon: Users, label: 'Gia đình' },
  { to: '/messages', icon: MessageCircle, label: 'Tin nhắn' },
  { to: '/profile', icon: User, label: 'Hồ sơ' },
];

// Chế độ Con cháu (Người giám sát từ xa): Rút gọn 3 tab chính (Trang chủ, Gia đình, Hồ sơ)
const SUPERVISOR_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Trang chủ', exact: true },
  { to: '/family', icon: Users, label: 'Gia đình' },
  { to: '/profile', icon: User, label: 'Hồ sơ' },
];

// Chế độ Người chăm sóc (Hộ lý): 4 tab chuyên biệt theo yêu cầu người dùng
const CAREGIVER_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Nhiệm vụ', exact: true },
  { to: '/medications', icon: Pill, label: 'Thuốc hôm nay' },
  { to: '/family', icon: ClipboardList, label: 'Bệnh án cụ' },
  { to: '/profile', icon: User, label: 'Hồ sơ' },
];

export default function BottomNav() {
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const deviceMode = useRoleModeStore((s) => s.deviceMode);

  const isSupervisor = roleMode === 'supervisor';
  const isCaregiver = roleMode === 'caregiver';
  const isPcSupervisor = isSupervisor && deviceMode === 'pc';
  const items = isSupervisor ? SUPERVISOR_ITEMS : isCaregiver ? CAREGIVER_ITEMS : PATIENT_ITEMS;

  return (
    <nav
      className={`${styles.nav} ${isSupervisor ? styles.supervisorNav : ''} ${
        isCaregiver ? styles.caregiverNav : ''
      } ${isPcSupervisor ? styles.pcSupervisorNav : ''} tour-nav`}
      aria-label="Điều hướng chính"
    >
      {items.map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''} ${
              isSupervisor ? styles.supervisorItem : ''
            }`
          }
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
