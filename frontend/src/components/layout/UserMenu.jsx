import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserProfileModal from './UserProfileModal';
import SettingsModal from './SettingsModal';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && buttonRef.current &&
          !menuRef.current.contains(e.target) &&
          !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleProfile = () => {
    setShowProfile(true);
    setIsOpen(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
    setIsOpen(false);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={styles.userBtn}
        onClick={handleToggle}
        title={user?.name || 'User'}
      >
        <div className={styles.avatar}>
          {getInitials(user?.name)}
        </div>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className={styles.menu}
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button className={styles.menuItem} onClick={handleProfile}>
            <User size={18} />
            <span>Thông Tin</span>
          </button>
          <button className={styles.menuItem} onClick={handleSettings}>
            <Settings size={18} />
            <span>Cài Đặt</span>
          </button>
          <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng Xuất</span>
          </button>
        </div>,
        document.body
      )}

      {showProfile && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
