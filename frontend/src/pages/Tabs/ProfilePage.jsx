import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mic, Pill, History, Settings, Palette, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserProfileModal from '../../components/layout/UserProfileModal';
import GiaoDienModal from '../../components/layout/GiaoDienModal';
import styles from './TabPages.module.css';

const initials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(-2) || 'Đ+';

// Tab Hồ sơ: thay cho menu avatar cũ; Giọng nhắc (trước là 1 tab) và Tủ thuốc nằm ở đây.
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'profile' | 'theme'

  const items = [
    { icon: User, label: 'Thông tin cá nhân', desc: 'Họ tên, số điện thoại, BHYT', onClick: () => setModal('profile') },
    { icon: Mic, label: 'Giọng nhắc', desc: 'Ghi âm giọng người thân để nhắc uống thuốc', onClick: () => navigate('/voice') },
    { icon: Pill, label: 'Tủ thuốc', desc: 'Các đơn thuốc và thuốc đang dùng', onClick: () => navigate('/medications') },
    { icon: History, label: 'Lịch sử quét đơn', onClick: () => navigate('/scan-history') },
    { icon: Palette, label: 'Giao diện', onClick: () => setModal('theme') },
    { icon: Settings, label: 'Cài đặt', desc: 'Cỡ chữ, nâng cấp gói', onClick: () => navigate('/settings') },
  ];

  const handleLogout = () => {
    if (!window.confirm('Đăng xuất khỏi DIA+?')) return;
    logout();
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Hồ sơ</h1>
      <div className={`${styles.card} ${styles.profileHead}`}>
        <span className={styles.avatar} aria-hidden="true">{initials(user?.name)}</span>
        <div>
          <p className={styles.name}>{user?.name || 'Người dùng DIA+'}</p>
          <p className={styles.meta}>{user?.phone || user?.email || ''}</p>
          {user?.user_code && <p className={styles.meta}>Mã của bạn: {user.user_code}</p>}
        </div>
      </div>

      <nav className={`${styles.card} ${styles.menu}`} aria-label="Hồ sơ">
        {items.map(({ icon: Icon, label, desc, onClick }) => (
          <button key={label} type="button" className={styles.item} onClick={onClick}>
            <span className={styles.itemIcon}><Icon size={22} aria-hidden="true" /></span>
            <span className={styles.itemText}>
              {label}
              {desc && <span className={styles.itemDesc}>{desc}</span>}
            </span>
            <ChevronRight size={20} className={styles.chevron} aria-hidden="true" />
          </button>
        ))}
        <button type="button" className={`${styles.item} ${styles.logout}`} onClick={handleLogout}>
          <span className={styles.itemIcon}><LogOut size={22} aria-hidden="true" /></span>
          <span className={styles.itemText}>Đăng xuất</span>
        </button>
      </nav>

      {modal === 'profile' && <UserProfileModal onClose={() => setModal(null)} />}
      {modal === 'theme' && <GiaoDienModal onClose={() => setModal(null)} />}
    </div>
  );
}
