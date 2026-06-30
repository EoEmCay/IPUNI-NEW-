import { useEffect } from 'react';
import { Check } from 'lucide-react';
import styles from './SuccessToast.module.css';

export default function SuccessToast({ message = 'Thành Công', onClose, duration = 1500 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <Check size={20} className={styles.icon} />
        <span className={styles.text}>{message}</span>
      </div>
    </div>
  );
}
