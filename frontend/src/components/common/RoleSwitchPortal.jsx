import { createPortal } from 'react-dom';
import { User, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './RoleSwitchPortal.module.css';

const ROLE_META = {
  patient: {
    title: 'Chế độ Bố / Mẹ',
    tag: 'Bố / Mẹ · Người cao tuổi',
    sub: 'Giao diện tối giản, cỡ chữ to, chuông nhắc ấm áp từ người thân...',
    syncText: 'Đang chuyển sang Chế độ Bố / Mẹ...',
    icon: User,
    overlayClass: '',
    ringClass: '',
    cardClass: '',
    orbClass: '',
    tagClass: '',
  },
  caregiver: {
    title: 'Chế độ Người Chăm Sóc',
    tag: 'Hộ lý · Người chăm sóc trực tiếp',
    sub: 'Checklist chia thuốc, đo đường huyết trực tiếp, chụp ảnh & ghi chú...',
    syncText: 'Đang chuyển sang Chế độ Người Chăm Sóc...',
    icon: HeartHandshake,
    overlayClass: styles.overlayCaregiver,
    ringClass: styles.ringCaregiver,
    cardClass: styles.cardBoxCaregiver,
    orbClass: styles.iconOrbCaregiver,
    tagClass: styles.tierTagCaregiver,
  },
  supervisor: {
    title: 'Chế độ Người Giám Sát',
    tag: 'Con cháu · Người giám sát từ xa',
    sub: 'Đang kết nối & theo dõi sức khỏe Bố/Mẹ từ xa trên PC & Mobile...',
    syncText: 'Đang chuyển sang Chế độ Người Giám Sát...',
    icon: ShieldCheck,
    overlayClass: styles.overlaySupervisor,
    ringClass: styles.ringSupervisor,
    cardClass: styles.cardBoxSupervisor,
    orbClass: styles.iconOrbSupervisor,
    tagClass: styles.tierTagSupervisor,
  },
};

export default function RoleSwitchPortal() {
  const transitioning = useRoleModeStore((s) => s.transitioning);
  const targetRole = useRoleModeStore((s) => s.targetRole);

  if (!transitioning || typeof document === 'undefined') return null;

  const currentMeta = ROLE_META[targetRole] || ROLE_META.patient;
  const RoleIcon = currentMeta.icon;

  return createPortal(
    <div
      className={`${styles.overlay} ${currentMeta.overlayClass}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${styles.ring} ${currentMeta.ringClass}`}
        aria-hidden="true"
      />

      <div className={styles.cardStage}>
        {/* Thẻ hiển thị rõ ràng CHẾ ĐỘ ĐANG CHUYỂN SANG, luôn chính diện không bị lộn ngược chữ */}
        <div className={`${styles.cardBox} ${currentMeta.cardClass}`}>
          <div className={`${styles.iconOrb} ${currentMeta.orbClass}`}>
            <RoleIcon size={36} />
          </div>
          <span className={`${styles.tierTag} ${currentMeta.tagClass}`}>
            {currentMeta.tag}
          </span>
          <h2 className={styles.roleTitle}>{currentMeta.title}</h2>
          <p className={styles.roleSub}>{currentMeta.sub}</p>
        </div>
      </div>

      <div className={styles.syncBox}>
        <div className={styles.syncPill}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <Sparkles size={14} />
          <span>{currentMeta.syncText}</span>
        </div>
        <div className={styles.syncTrack}>
          <div className={styles.syncFill} />
        </div>
      </div>
    </div>,
    document.body
  );
}
