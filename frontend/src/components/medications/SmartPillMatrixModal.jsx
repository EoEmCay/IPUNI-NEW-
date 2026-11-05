import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
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
              <Layers size={24} />
            </div>
            <div>
              <h2 className={styles.title}>Hộp thuốc thông minh 7x4 CalenDIA+</h2>
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
            <div className={styles.introCardText}>
              <span className={styles.introDot} />
              <span>
                Mỗi khi lia chuột hoặc chạm vào ô bất kỳ, ô đó sẽ <strong>sáng vàng dịu mắt</strong>. Chạm vào ô để xem chi tiết thuốc hoặc điều chỉnh lịch uống.
              </span>
            </div>
            <span className={styles.hardwarePillBadge}>
              Thiết bị: CalenDIA+ Model v2
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
