import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Bluetooth, Check } from 'lucide-react';
import SmartPillMatrix from './SmartPillMatrix';
import { medicationsService } from '../../services/medications.service';
import styles from './SmartPillMatrixModal.module.css';

export default function SmartPillMatrixModal({
  medications = [],
  onClose,
  onUpdateMedications,
}) {
  const [currentMeds, setCurrentMeds] = useState(medications);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Cập nhật currentMeds nếu prop medications thay đổi từ bên ngoài
  useEffect(() => {
    if (Array.isArray(medications) && medications.length > 0) {
      setCurrentMeds(medications);
    }
  }, [medications]);

  // Khoá cuộn trang bên dưới khi modal mở
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Xử lý khi người dùng chỉnh sửa từng ô (bấm "Lưu vào ngăn này")
  const handleMatrixChange = useCallback(async (nextMatrix, syncedMeds) => {
    if (Array.isArray(syncedMeds) && syncedMeds.length > 0) {
      setCurrentMeds(syncedMeds);
    }
    setSaveSuccessMsg('Đã lưu thay đổi vào ngăn kéo!');
    const timer = setTimeout(() => setSaveSuccessMsg(''), 3000);

    // Đồng bộ ngay vào backend cơ sở dữ liệu cho các thuốc có cữ thay đổi
    try {
      const list = syncedMeds || [];
      for (const med of list) {
        if (med.id) {
          const oldMed = (medications || []).find((m) => m.id === med.id);
          const oldTimes = JSON.stringify(oldMed?.times || []);
          const newTimes = JSON.stringify(med.times || []);
          if (oldTimes !== newTimes) {
            await medicationsService.update(med.id, {
              times: med.times,
              slots: med.slots,
              days_of_week: med.days_of_week,
            });
          }
        }
      }
      if (onUpdateMedications) {
        onUpdateMedications(list);
      }
    } catch (e) {
      console.error('Lỗi tự động đồng bộ thuốc vào backend:', e);
    }

    return () => clearTimeout(timer);
  }, [medications, onUpdateMedications]);

  // Nút "Lưu & Đóng" hoặc "Đóng": luôn đảm bảo dữ liệu mới nhất được lưu trước khi đóng
  const handleSaveAndClose = async () => {
    setIsSaving(true);
    try {
      for (const med of currentMeds) {
        if (med.id) {
          await medicationsService.update(med.id, {
            times: med.times,
            slots: med.slots,
            days_of_week: med.days_of_week,
          }).catch(() => {});
        }
      }
      if (onUpdateMedications) {
        await Promise.resolve(onUpdateMedications(currentMeds)).catch(() => {});
      }
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleSaveAndClose} role="dialog" aria-modal="true">
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
            onClick={handleSaveAndClose}
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
            medications={currentMeds && currentMeds.length > 0 ? currentMeds : medications}
            isScanReview={false}
            onChange={handleMatrixChange}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerNote}>
            {saveSuccessMsg ? (
              <strong style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} strokeWidth={3} /> {saveSuccessMsg}
              </strong>
            ) : (
              'Hệ thống tự động đồng bộ lịch với chuông báo và thông báo người nhà'
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSaveAndClose}
              disabled={isSaving}
            >
              <Check size={16} strokeWidth={3} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu & Đóng'}</span>
            </button>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={handleSaveAndClose}
              disabled={isSaving}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
