import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Palette, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useT } from '../../hooks/useT';
import useLangStore from '../../store/langStore';

const LANG_FLAGS = [
  { code: 'vi', emoji: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', emoji: '🇬🇧', label: 'English' },
  { code: 'lo', emoji: '🇱🇦', label: 'ພາສາລາວ' },
];
import { useNavigate } from 'react-router-dom';
import UserProfileModal from './UserProfileModal';
import GiaoDienModal from './GiaoDienModal';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const t = useT();
  const { lang, setLang } = useLangStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGiaoDien, setShowGiaoDien] = useState(false);
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

  const handleToggle = () => setIsOpen((o) => !o);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const closeAllModals = () => {
    setShowProfile(false);
    setShowGiaoDien(false);
  };

  const handleProfile = () => {
    closeAllModals();
    setShowProfile(true);
    setIsOpen(false);
  };

  const handleSettings = () => {
    closeAllModals();
    setIsOpen(false);
    navigate('/settings');
  };

  const handleGiaoDien = () => {
    closeAllModals();
    setShowGiaoDien(true);
    setIsOpen(false);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <>
      <div className={styles.wrap}>
        <button
          ref={buttonRef}
          className={`${styles.userBtn} user-menu-btn`}
          onClick={handleToggle}
          title={user?.name || 'User'}
        >
          <div className={styles.avatar}>
            {getInitials(user?.name)}
          </div>
        </button>

        {isOpen && (
          <div ref={menuRef} className={styles.menu}>
            <button className={styles.menuItem} onClick={handleProfile}>
              <User size={18} />
              <span>{t.userMenu.profile}</span>
            </button>
            <div className={styles.langRow}>
              <Globe size={15} className={styles.langIcon} />
              <span className={styles.langRowLabel}>{t.userMenu.language || 'Ngôn ngữ'}</span>
              <div className={styles.langFlags}>
                {LANG_FLAGS.map(({ code, emoji, label }) => (
                  <button
                    key={code}
                    className={`${styles.langFlagBtn} ${lang === code ? styles.langFlagActive : ''}`}
                    onClick={() => { setLang(code); setIsOpen(false); }}
                    title={label}
                    style={{ fontSize: 16 }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <button className={`${styles.menuItem} ${styles.giaoDienItem}`} onClick={handleGiaoDien}>
              <Palette size={18} />
              <span>{t.userMenu.theme}</span>
            </button>
            <button className={styles.menuItem} onClick={handleSettings}>
              <Settings size={18} />
              <span>{t.userMenu.settings}</span>
            </button>
            <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
              <LogOut size={18} />
              <span>{t.userMenu.logout}</span>
            </button>
          </div>
        )}
      </div>

      {showProfile && (
        <UserProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showGiaoDien && (
        <GiaoDienModal onClose={() => setShowGiaoDien(false)} />
      )}
    </>
  );
}
