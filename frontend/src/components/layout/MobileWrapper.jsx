import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import { isNative, handleHardwareBack, showExitToast } from '../../lib/native';
import RoleSwitchPortal from '../common/RoleSwitchPortal';
import RoleSelectorModal from '../common/RoleSelectorModal';
import styles from './MobileWrapper.module.css';

const SIM_KEY = 'diaplus_simulated_device_v1';

export default function MobileWrapper({ children }) {
  const navigate = useNavigate();
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const deviceMode = useRoleModeStore((s) => s.deviceMode);

  const isSupervisor = roleMode === 'supervisor';
  const isPcSupervisor = isSupervisor && deviceMode === 'pc';

  // Chế độ giả lập thiết bị trên màn hình máy tính (mặc định là Android APK)
  const [simDevice, setSimDevice] = useState(() => {
    try {
      return localStorage.getItem(SIM_KEY) || 'android';
    } catch {
      return 'android';
    }
  });

  // Đồng hồ hiển thị thời gian thực trên thanh trạng thái Android
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSetSimDevice = (dev) => {
    setSimDevice(dev);
    try {
      localStorage.setItem(SIM_KEY, dev);
    } catch {}
  };

  // Khi đang chạy app native thật (trên điện thoại Android/iOS)
  if (isNative || isPcSupervisor) {
    return (
      <div className={isPcSupervisor ? styles.pcCanvas : styles.nativeCanvas}>
        <div
          className={`${styles.mobileWrapper} ${
            isPcSupervisor ? styles.pcSupervisorWrapper : styles.nativeFullWrapper
          }`}
        >
          {children}
        </div>
        <RoleSwitchPortal />
        <RoleSelectorModal />
      </div>
    );
  }

  // Khi đang chạy web/dev (npm run dev) trên máy tính: Hiển thị khung giả lập Android APK / iPhone
  const isAndroid = simDevice === 'android';

  return (
    <div className={styles.desktopCanvas}>
      {/* Nút bấm chuyển đổi nhanh chế độ giả lập Android APK / iOS */}
      <div className={styles.simulatorSwitcher} role="toolbar" aria-label="Bộ chuyển đổi giả lập thiết bị">
        <button
          type="button"
          className={`${styles.simBtn} ${isAndroid ? styles.simBtnActive : ''}`}
          onClick={() => handleSetSimDevice('android')}
          title="Giả lập màn hình Android APK (Galaxy / Pixel)"
        >
          <span className={styles.simIcon} aria-hidden="true">🤖</span>
          <span>Android APK</span>
        </button>
        <button
          type="button"
          className={`${styles.simBtn} ${!isAndroid ? styles.simBtnActive : ''}`}
          onClick={() => handleSetSimDevice('ios')}
          title="Giả lập màn hình Apple iOS iPhone"
        >
          <span className={styles.simIcon} aria-hidden="true">🍏</span>
          <span>iOS</span>
        </button>
      </div>

      <div
        className={`${styles.mobileWrapper} ${
          isAndroid ? styles.androidFrame : styles.iphoneFrame
        } mobile-frame`}
      >
        {/* THANH TRẠNG THÁI GIẢ LẬP ANDROID */}
        {isAndroid && (
          <header className={styles.androidStatusBar} aria-label="Thanh trạng thái Android">
            <span className={styles.androidTime}>{timeStr}</span>
            <div className={styles.punchHole} aria-hidden="true">
              <span className={styles.punchHoleLens} />
            </div>
            <div className={styles.androidStatusIcons} aria-hidden="true">
              <Signal size={13} strokeWidth={2.5} />
              <Wifi size={13} strokeWidth={2.5} />
              <div className={styles.batteryGroup}>
                <span className={styles.batteryText}>98%</span>
                <BatteryMedium size={15} strokeWidth={2.5} />
              </div>
            </div>
          </header>
        )}

        {/* DYNAMIC ISLAND GIẢ LẬP IPHONE */}
        {!isAndroid && (
          <div className={styles.dynamicIsland} aria-hidden="true">
            <span className={styles.cameraDot} />
          </div>
        )}

        {/* NỘI DUNG ỨNG DỤNG CHÍNH */}
        <div className={styles.appScrollContent}>
          {children}
        </div>

        {/* THANH ĐIỀU HƯỚNG DƯỚI ĐÁY ANDROID (3 PHÍM ĐIỀU HƯỚNG THẬT) */}
        {isAndroid && (
          <nav className={styles.androidNavBar} aria-label="Thanh điều hướng Android">
            {/* Phím Back: Gọi đúng hàm xử lý nút Back phần cứng */}
            <button
              type="button"
              className={styles.androidNavBtn}
              onClick={() => handleHardwareBack({ canGoBack: window.history.length > 1 })}
              title="Nút Back Android (Quay lại / Đóng pop-up)"
              aria-label="Quay lại"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {/* Phím Home: Về thẳng Trang chủ Dashboard */}
            <button
              type="button"
              className={styles.androidNavBtn}
              onClick={() => navigate('/dashboard')}
              title="Nút Home Android (Về màn hình chính)"
              aria-label="Màn hình chính"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="9" />
              </svg>
            </button>

            {/* Phím Recents / Đa nhiệm */}
            <button
              type="button"
              className={styles.androidNavBtn}
              onClick={() => showExitToast('Ứng dụng DIA+ đang chạy nền (Android Task)')}
              title="Nút Recents Android (Đa nhiệm)"
              aria-label="Đa nhiệm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="3" />
              </svg>
            </button>
          </nav>
        )}

        {/* THANH HOME INDICATOR IPHONE */}
        {!isAndroid && <div className={styles.homeIndicator} aria-hidden="true" />}
      </div>

      <RoleSwitchPortal />
      <RoleSelectorModal />
    </div>
  );
}
