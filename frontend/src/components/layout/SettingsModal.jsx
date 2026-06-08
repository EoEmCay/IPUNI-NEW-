import { Sparkles, Bell, Shield, HelpCircle } from 'lucide-react';
import Modal from '../common/Modal';
import useThemeStore from '../../store/themeStore';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ onClose }) {
  const { isCuteMode, toggleCuteMode } = useThemeStore();

  return (
    <Modal title="Cài Đặt" onClose={onClose}>
      <div className={styles.container}>

        <p className={styles.sectionLabel}>Giao diện</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: isCuteMode ? '#F5F0FF' : '#FEF3C7' }}>
              <Sparkles size={18} color={isCuteMode ? '#A855F7' : '#D97706'} />
            </div>
            <div>
              <p className={styles.rowTitle}>Cute Mode</p>
              <p className={styles.rowDesc}>Giao diện trẻ trung, màu pastel dễ thương</p>
            </div>
          </div>
          <button
            className={`${styles.toggle} ${isCuteMode ? styles.toggleOn : ''}`}
            onClick={toggleCuteMode}
            aria-label="Toggle Cute Mode"
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>Thông báo</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#EFF6FF' }}>
              <Bell size={18} color="#1B5FA6" />
            </div>
            <div>
              <p className={styles.rowTitle}>Nhắc đo đường huyết</p>
              <p className={styles.rowDesc}>Nhắc nhở mỗi sáng lúc 7:00 và chiều 17:00</p>
            </div>
          </div>
          <div className={styles.comingSoon}>Sắp ra mắt</div>
        </div>

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>Khác</p>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#F0FDF4' }}>
              <Shield size={18} color="#16A34A" />
            </div>
            <div>
              <p className={styles.rowTitle}>Quyền riêng tư</p>
              <p className={styles.rowDesc}>Quản lý dữ liệu sức khỏe của bạn</p>
            </div>
          </div>
          <div className={styles.comingSoon}>Sắp ra mắt</div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <div className={styles.iconWrap} style={{ background: '#F8F8F8' }}>
              <HelpCircle size={18} color="#6B7A8D" />
            </div>
            <div>
              <p className={styles.rowTitle}>Hỗ trợ & Hướng dẫn</p>
              <p className={styles.rowDesc}>Câu hỏi thường gặp, liên hệ hỗ trợ</p>
            </div>
          </div>
          <div className={styles.comingSoon}>Sắp ra mắt</div>
        </div>

        <p className={styles.version}>IPUNI v1.0.0 — Chăm sóc sức khỏe thông minh</p>
      </div>
    </Modal>
  );
}
