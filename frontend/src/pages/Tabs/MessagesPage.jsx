import { MessageCircle } from 'lucide-react';
import styles from './TabPages.module.css';

// Tab Tin nhắn: chưa có tính năng nhắn tin - giữ chỗ theo giao diện mới.
export default function MessagesPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tin nhắn</h1>
      <div className={`${styles.card} ${styles.soon}`}>
        <span className={styles.soonIcon}><MessageCircle size={36} aria-hidden="true" /></span>
        <p className={styles.soonTitle}>Sắp ra mắt</p>
        <p className={styles.soonText}>Nhắn tin với người nhà và bác sĩ ngay trong DIA+.</p>
      </div>
    </div>
  );
}
