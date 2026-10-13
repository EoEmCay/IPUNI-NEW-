import { useLocation } from 'react-router-dom';
import useRoleModeStore from '../../store/roleModeStore';
import RoleSwitchPortal from '../common/RoleSwitchPortal';
import RoleSelectorModal from '../common/RoleSelectorModal';
import styles from './MobileWrapper.module.css';

export default function MobileWrapper({ children }) {
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const deviceMode = useRoleModeStore((s) => s.deviceMode);

  const isSupervisor = roleMode === 'supervisor';
  const isPcSupervisor = isSupervisor && deviceMode === 'pc';

  // Chế độ Khung iPhone áp dụng cho:
  // - Chế độ Người bệnh / Người sử dụng (Patient mode)
  // - Chế độ Người chăm sóc / Hộ lý (Caregiver mode)
  // - Hoặc Chế độ Người giám sát khi chọn xem dạng Mobile (deviceMode === 'mobile')
  const isIphoneFrame = !isPcSupervisor;

  return (
    <div className={isIphoneFrame ? styles.desktopCanvas : styles.pcCanvas}>
      <div
        className={`${styles.mobileWrapper} ${
          isPcSupervisor ? styles.pcSupervisorWrapper : styles.iphoneFrame
        } iphone-frame`}
      >
        {isIphoneFrame && (
          <div className={styles.dynamicIsland} aria-hidden="true">
            <span className={styles.cameraDot} />
          </div>
        )}
        {children}
        {isIphoneFrame && <div className={styles.homeIndicator} aria-hidden="true" />}
      </div>
      <RoleSwitchPortal />
      <RoleSelectorModal />
    </div>
  );
}
