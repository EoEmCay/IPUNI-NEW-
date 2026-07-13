import { Bell, BookOpen, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import NotificationsModal from './NotificationsModal';
import MedicationReminderToast from '../common/MedicationReminderToast';
import useThemeStore from '../../store/themeStore';
import { useNotifications } from '../../hooks/useNotifications';
import Logo from '../common/Logo';
import DemoCountdown from '../common/DemoCountdown';
import styles from './TopBar.module.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { isCuteMode } = useThemeStore();
  const { isOpen, medications, appointments, hasNotifications, isTimeToDrink, upcomingMeds, handleOpen, handleClose } = useNotifications();

  return (
    <>
      <header className={`${styles.topbar} tour-step-1`}>
        <div className={styles.logo}>
          <Logo size="sm" variant="onDark" />
          {isCuteMode && <Sparkles size={14} color="#fff" strokeWidth={2.5} />}
          {isCuteMode && <span className={styles.cuteBadge}>cute</span>}
        </div>
        
        <DemoCountdown />

        <div className={styles.actions}>
          <button className={styles.iconBtn} title="Lời khuyên" onClick={() => navigate('/advice')}>
            <BookOpen size={20} />
          </button>
          <button
            className={`${styles.bellBtn} ${hasNotifications ? styles.hasBadge : ''} ${isTimeToDrink ? styles.active : ''}`}
            title="Thông báo"
            onClick={handleOpen}
          >
            <Bell size={20} />
            {hasNotifications && <span className={styles.badge} />}
          </button>
          <UserMenu />
        </div>
      </header>
      <NotificationsModal
        isOpen={isOpen}
        onClose={handleClose}
        medications={medications}
        appointments={appointments}
        hasNotifications={hasNotifications}
      />
      {isTimeToDrink && <MedicationReminderToast medications={upcomingMeds} />}
    </>
  );
}
