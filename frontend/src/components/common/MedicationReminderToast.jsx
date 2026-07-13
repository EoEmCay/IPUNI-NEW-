import { Pill, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useT } from '../../hooks/useT';
import styles from './MedicationReminderToast.module.css';

export default function MedicationReminderToast({ medications }) {
  const [isVisible, setIsVisible] = useState(true);
  const t = useT();

  // Auto hide after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <Pill size={24} />
        </div>
        <div className={styles.message}>
          <p className={styles.title}>{t.common?.medReminderToastTitle || '⏰ Đến giờ uống thuốc!'}</p>
          <p className={styles.description}>
            {medications.length === 1
              ? medications[0].name
              : `${medications.length} ${t.common?.medCountToTake || 'loại thuốc cần uống'}`}
          </p>
        </div>
      </div>
      <button
        className={styles.closeBtn}
        onClick={() => setIsVisible(false)}
        title={t.common?.close || 'Đóng'}
      >
        <X size={18} />
      </button>
    </div>
  );
}
