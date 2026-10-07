import { Bell } from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import MedicationReminderToast from '../common/MedicationReminderToast';
import { useNotifications } from '../../hooks/useNotifications';

// Chuông thông báo + hộp thông báo + popup nhắc đến giờ uống thuốc. Dùng ở thanh trên (các trang)
// và header riêng của Trang chủ. `css` = class của nơi dùng: { btn, hasBadge, active, badge }.
export default function NotificationBell({ css }) {
  const { isOpen, medications, appointments, hasNotifications, isTimeToDrink, upcomingMeds, handleOpen, handleClose } = useNotifications();

  return (
    <>
      <button
        type="button"
        className={`${css.btn} ${hasNotifications ? css.hasBadge : ''} ${isTimeToDrink ? css.active : ''}`}
        aria-label="Thông báo"
        onClick={handleOpen}
      >
        <Bell size={22} />
        {hasNotifications && <span className={css.badge} />}
      </button>
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
