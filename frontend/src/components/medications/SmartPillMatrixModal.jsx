import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bluetooth } from 'lucide-react';
import SmartPillMatrix from './SmartPillMatrix';
import styles from './SmartPillMatrixModal.module.css';

export default function SmartPillMatrixModal({
  medications = [],
  onClose,
  onUpdateMedications,
}) {
  // Khoá cuộn trang bên dưới khi modal mở
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleConfirm = (syncedMeds) => {
    if (onUpdateMedications) {
      onUpdateMedications(syncedMeds);
    }
    onClose();
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconPod}>
              <Bluetooth size={24} />
            </div>
            <div>
              <h2 className={styles.title}>CalenDIA+ Bluetooth</h2>
              <p className={styles.subtitle}>
                28 ngăn kéo phân bổ theo 7 ngày trong tuần và 4 buổi trong ngày
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.introCard}>
            <span className={styles.hardwarePillBadge}>
              <span className={styles.introDot} />
              <Bluetooth size={14} />
              Thiết bị kết nối: CalenDIA+ Bluetooth
            </span>
          </div>

          <SmartPillMatrix
            medications={medications}
            isScanReview={false}
            onConfirm={handleConfirm}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerNote}>
            Hệ thống tự động đồng bộ lịch với chuông báo và thông báo người nhà
          </span>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
