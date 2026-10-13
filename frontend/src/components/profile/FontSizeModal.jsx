import { ZoomIn, Check, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import useAccessibilityStore from '../../store/accessibilityStore';
import styles from './FontSizeModal.module.css';

const ZOOM_LEVELS = [
  { label: '1x', scale: 1, name: 'Chuẩn', desc: 'Mặc định (100%)' },
  { label: '2x', scale: 1.1, name: 'Lớn', desc: 'Tăng nhẹ (+10%)' },
  { label: '3x', scale: 1.2, name: 'Rất lớn', desc: 'Dễ đọc (+20%)' },
  { label: '4x', scale: 1.3, name: 'Tối đa', desc: 'Lớn nhất (+30%)' },
];

export default function FontSizeModal({ onClose }) {
  const { fontScale, setFontScale } = useAccessibilityStore();

  const handleSelectScale = (scale) => {
    setFontScale(scale);
    // Đồng bộ thuộc tính CSS variable trên root để hỗ trợ cả PC và Mobile
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', String(scale));
    }
  };

  return (
    <Modal title="Cỡ Chữ & Khả Năng Tiếp Cận" onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.introCard}>
          <div className={styles.iconWrap}>
            <ZoomIn size={22} color="#0284c7" />
          </div>
          <div>
            <h2 className={styles.introTitle}>Tùy Chỉnh Kích Thước Chữ</h2>
            <p className={styles.introDesc}>
              Hoạt động đồng bộ trên cả màn hình <strong>PC (máy tính)</strong> và <strong>Mobile (điện thoại)</strong>.
            </p>
          </div>
        </div>

        {/* 4 Nút Lựa Chọn Cỡ Chữ Giống Bên Người Bệnh */}
        <div className={styles.zoomGrid}>
          {ZOOM_LEVELS.map(({ label, scale, name, desc }) => {
            const isActive = fontScale === scale;
            return (
              <button
                key={label}
                type="button"
                className={`${styles.zoomCard} ${isActive ? styles.zoomCardActive : ''}`}
                onClick={() => handleSelectScale(scale)}
              >
                <div className={styles.cardTop}>
                  <span className={styles.levelBadge}>{label}</span>
                  {isActive && (
                    <span className={styles.checkBadge}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className={styles.levelName}>{name}</div>
                <div className={styles.levelDesc}>{desc}</div>
              </button>
            );
          })}
        </div>

        {/* Khung Xem Trước (Live Preview) */}
        <div className={styles.previewBox}>
          <div className={styles.previewHeader}>
            <Sparkles size={16} color="#0284c7" />
            <span>Xem trước trực tiếp theo tỷ lệ {fontScale}x:</span>
          </div>
          <div
            className={styles.previewContent}
            style={{ fontSize: `${14 * fontScale}px`, lineHeight: 1.6 }}
          >
            <p className={styles.previewHeading}>
              DIA+ · Nhắc nhở uống thuốc đúng giờ
            </p>
            <p className={styles.previewText}>
              Đường huyết sáng nay của Bác Nguyễn Văn An: <strong>6.2 mmol/L (Bình thường)</strong>.
              Đã uống cữ thuốc sáng lúc 07:15.
            </p>
          </div>
        </div>

        <button type="button" className={styles.doneBtn} onClick={onClose}>
          Đã chọn xong
        </button>
      </div>
    </Modal>
  );
}
