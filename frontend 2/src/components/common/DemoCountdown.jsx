import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './DemoCountdown.module.css';

export default function DemoCountdown() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [timeLeft, setTimeLeft] = useState(null);

  const isDemo = user?.is_demo || (user?.email && user.email.startsWith('demo_'));

  useEffect(() => {
    if (!user || !isDemo) return;

    // 30 mins in ms
    const DEMO_DURATION = 30 * 60 * 1000;
    
    // Calculate expiration time from created_at (fallback to now if backend is outdated)
    let dateStr = user.created_at || new Date().toISOString();
    if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    }
    
    let createdAtMs = new Date(dateStr).getTime();
    if (isNaN(createdAtMs)) {
      createdAtMs = Date.now(); // Fallback nếu parse lỗi
    }
    const expireTime = createdAtMs + DEMO_DURATION;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = expireTime - now;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        // Automatically log out
        logout();
        alert('Phiên bản dùng thử đã kết thúc (30 phút). Dữ liệu của bạn đã được dọn dẹp. Vui lòng đăng ký tài khoản để tiếp tục sử dụng.');
        window.location.href = '/register';
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, logout]);

  if (!user || !isDemo) {
    return null;
  }

  if (timeLeft === null) {
    return <div className={styles.demoCountdown}><span>⏳ Đang tải...</span></div>;
  }

  // Format timeLeft to mm:ss
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className={styles.demoCountdown}>
      <span>⏳ Demo: <strong>{formattedTime}</strong></span>
    </div>
  );
}
