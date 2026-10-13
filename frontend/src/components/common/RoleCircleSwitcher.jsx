import { useState, useRef, useEffect } from 'react';
import { User, HeartHandshake, ShieldCheck, Check } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './RoleCircleSwitcher.module.css';

const ROLES = [
  {
    id: 'patient',
    label: 'Bố / Mẹ',
    title: 'Chế độ Bố / Mẹ (Bệnh nhân)',
    icon: User,
    circleClass: styles.circlePatient,
  },
  {
    id: 'caregiver',
    label: 'Hộ lý',
    title: 'Chế độ Người chăm sóc (Hộ lý)',
    icon: HeartHandshake,
    circleClass: styles.circleCaregiver,
  },
  {
    id: 'supervisor',
    label: 'Con cháu',
    title: 'Chế độ Người giám sát (Con cháu)',
    icon: ShieldCheck,
    circleClass: styles.circleSupervisor,
  },
];

export default function RoleCircleSwitcher({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const switchRole = useRoleModeStore((s) => s.switchRole);
  const wrapperRef = useRef(null);

  // Đóng khi nhấp ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentRole = ROLES.find((r) => r.id === roleMode) || ROLES[0];
  const CurrentIcon = currentRole.icon;

  const triggerClass =
    roleMode === 'caregiver'
      ? styles.triggerCaregiver
      : roleMode === 'supervisor'
      ? styles.triggerSupervisor
      : styles.triggerPatient;

  const handleSelectRole = (targetId) => {
    setIsOpen(false);
    if (targetId !== roleMode) {
      switchRole(targetId);
    }
  };

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className}`}>
      {/* Vòng tròn trigger chính */}
      <button
        type="button"
        className={`${styles.triggerBtn} ${triggerClass} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Đổi vai trò (Hiện tại: ${currentRole.label})`}
        title={`Đổi vai trò (Hiện tại: ${currentRole.label})`}
        aria-expanded={isOpen}
      >
        <CurrentIcon size={18} strokeWidth={2.4} />
        <span className={styles.subDot} aria-hidden="true">
          <span className={styles.subDotInner} />
        </span>
      </button>

      {/* Popover 3 vòng tròn chọn vai trò */}
      {isOpen && (
        <div className={styles.popover} role="menu" aria-label="Chọn vai trò">
          <p className={styles.popoverTitle}>Chọn vai trò</p>
          <div className={styles.circlesRow}>
            {ROLES.map((r) => {
              const RoleIcon = r.icon;
              const isActive = r.id === roleMode;

              return (
                <button
                  key={r.id}
                  type="button"
                  className={styles.roleOption}
                  onClick={() => handleSelectRole(r.id)}
                  title={r.title}
                  role="menuitem"
                >
                  <div
                    className={`${styles.circleBtn} ${r.circleClass} ${
                      isActive ? styles.activeRole : ''
                    }`}
                  >
                    <RoleIcon size={19} strokeWidth={2.3} />
                    {isActive && (
                      <span className={styles.checkDot} aria-hidden="true">
                        <Check size={9} strokeWidth={3.5} />
                      </span>
                    )}
                  </div>
                  <span
                    className={`${styles.roleLabel} ${
                      isActive ? styles.roleLabelActive : ''
                    }`}
                  >
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
