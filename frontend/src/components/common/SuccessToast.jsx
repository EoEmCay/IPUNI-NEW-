import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useT } from '../../hooks/useT';
import styles from './SuccessToast.module.css';

export default function SuccessToast({ message, onClose, duration = 1500 }) {
  const t = useT();
  const displayMessage = message || t.common.success || 'Thành Công';

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <Check size={20} className={styles.icon} />
        <span className={styles.text}>{displayMessage}</span>
      </div>
    </div>
  );
}
