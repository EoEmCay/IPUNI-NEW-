import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './DemoCountdown.module.css';

export default function DemoCountdown() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!user || !user.is_demo || !user.created_at) return;

    // 30 mins in ms
    const DEMO_DURATION = 30 * 60 * 1000;
    
    // Calculate expiration time from created_at
    // Fix cho Safari/iOS (chuyển "YYYY-MM-DD HH:mm:ss" thành "YYYY-MM-DDTHH:mm:ssZ")
    let dateStr = user.created_at;
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

  if (!user) {
    return <div className={styles.demoCountdown}><span>⏳ Chờ User...</span></div>;
  }
  
  if (!user.is_demo) {
    return <div className={styles.demoCountdown} style={{background: '#666'}}><span>⏳ Không phải Demo</span></div>;
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
