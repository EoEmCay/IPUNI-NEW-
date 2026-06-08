import { User, Mail, Phone, Calendar, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import styles from './UserProfileModal.module.css';

export default function UserProfileModal({ user, onClose }) {
  const userData = user || {
    name: 'Người Dùng Demo',
    email: 'khoi@example.com',
    phone: '0123456789',
    cccd: '123456789123',
    dateOfBirth: '1990-01-01',
    insuranceNumber: 'BH2024001',
    insuranceExpiry: '2025-12-31',
    bloodType: 'O+',
    allergies: 'Không có'
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal title="Thông Tin Cá Nhân" onClose={onClose}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className={styles.nameSection}>
            <h2 className={styles.name}>{userData?.name || 'N/A'}</h2>
            <p className={styles.email}>{userData?.email || 'N/A'}</p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.infoSection}>
          <div className={styles.infoGroup}>
            <div className={styles.infoLabel}>
              <User size={16} />
              <span>Họ và Tên</span>
            </div>
            <p className={styles.infoValue}>{userData?.name || 'N/A'}</p>
          </div>

          <div className={styles.infoGroup}>
            <div className={styles.infoLabel}>
              <Mail size={16} />
              <span>Email</span>
            </div>
            <p className={styles.infoValue}>{userData?.email || 'N/A'}</p>
          </div>

          <div className={styles.infoGroup}>
            <div className={styles.infoLabel}>
              <Phone size={16} />
              <span>Số Điện Thoại</span>
            </div>
            <p className={styles.infoValue}>{userData?.phone || 'Chưa cập nhật'}</p>
          </div>

          <div className={styles.infoGroup}>
            <div className={styles.infoLabel}>
              <FileText size={16} />
              <span>CCCD/CMT</span>
            </div>
            <p className={styles.infoValue}>{userData?.cccd || 'Chưa cập nhật'}</p>
          </div>

          <div className={styles.infoGroup}>
            <div className={styles.infoLabel}>
              <Calendar size={16} />
              <span>Ngày Sinh</span>
            </div>
            <p className={styles.infoValue}>{user?.dateOfBirth ? formatDate(userData.dateOfBirth) : 'Chưa cập nhật'}</p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bhytSection}>
          <h3 className={styles.bhytTitle}>Thông Tin BHYT</h3>
          <div className={styles.bhytCard}>
            <div className={styles.bhytRow}>
              <span className={styles.bhytLabel}>Mã BHYT</span>
              <span className={styles.bhytValue}>{userData?.insuranceNumber || 'Chưa cập nhật'}</span>
            </div>
            <div className={styles.bhytRow}>
              <span className={styles.bhytLabel}>Thời Hạn</span>
              <span className={styles.bhytValue}>{userData?.insuranceExpiry ? formatDate(user.insuranceExpiry) : 'Chưa cập nhật'}</span>
            </div>
            <div className={styles.bhytRow}>
              <span className={styles.bhytLabel}>Nhóm Máu</span>
              <span className={styles.bhytValue}>{userData?.bloodType || 'Chưa cập nhật'}</span>
            </div>
            <div className={styles.bhytRow}>
              <span className={styles.bhytLabel}>Dị Ứng</span>
              <span className={styles.bhytValue}>{userData?.allergies || 'Không có'}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
