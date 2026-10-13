import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ArrowRight, User, HeartHandshake, ShieldCheck } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './RoleSelectorModal.module.css';

const ROLES = [
  {
    id: 'patient',
    name: 'Bố / Mẹ · Người cao tuổi',
    target: 'Dành cho người cao tuổi điều trị tại nhà',
    tierLabel: 'Người bệnh',
    tierClass: styles.tierPillPatient,
    cardClass: '',
    orbClass: styles.orbPatient,
    icon: User,
    features: [
      'Giao diện chữ to, độ tương phản cao, chuông giọng nói con cháu nhắc nhở ấm áp.',
      'Nút bấm "Tôi đã uống" 1 chạm cực kỳ đơn giản, không cần thao tác phức tạp.',
      'Tự động đồng bộ báo về máy con cháu ngay khi hoàn thành cử thuốc.',
    ],
  },
  {
    id: 'caregiver',
    name: 'Người Chăm Sóc Trực Tiếp',
    target: 'Dành cho Hộ lý gia đình / Người giúp việc / Người thân ở cùng',
    tierLabel: 'Hộ lý trực tiếp',
    tierClass: styles.tierPillCaregiver,
    cardClass: styles.cardCaregiver,
    orbClass: styles.orbCaregiver,
    icon: HeartHandshake,
    features: [
      'Checklist chia & cho uống thuốc chi tiết từng cữ sáng, trưa, chiều, tối.',
      'Chụp ảnh khay thuốc / cụ uống thuốc để gửi bằng chứng xác nhận cho con cháu.',
      'Ghi nhận trực tiếp chỉ số đường huyết & huyết áp (cảnh báo hạ đường huyết tức thì).',
      'Sổ nhật ký tình trạng ăn uống, giấc ngủ và tinh thần của cụ mỗi ngày.',
    ],
  },
  {
    id: 'supervisor',
    name: 'Con Cháu · Người Giám Sát',
    target: 'Dành cho con cái ở xa, người bảo trợ & chi trả dịch vụ',
    tierLabel: 'Giám sát từ xa',
    tierClass: styles.tierPillSupervisor,
    cardClass: styles.cardSupervisor,
    orbClass: styles.orbSupervisor,
    icon: ShieldCheck,
    features: [
      'Bảng điều khiển từ xa thông minh trên cả máy tính (PC) lẫn điện thoại.',
      'Biểu đồ tuân thủ 7 ngày chuẩn y khoa, kiểm tra ảnh xác nhận của hộ lý.',
      'Thu âm giọng con nhắc nhở từ xa & cảnh báo khẩn cấp qua Zalo ZNS / Telegram.',
      'Đồng hồ đối chiếu đa múi giờ: Austin Texas, Washington, Singapore & UTC.',
    ],
  },
];

export default function RoleSelectorModal() {
  const isOpen = useRoleModeStore((s) => s.isRoleSelectorOpen);
  const activeRole = useRoleModeStore((s) => s.roleMode);
  const close = useRoleModeStore((s) => s.closeRoleSelector);
  const switchRole = useRoleModeStore((s) => s.switchRole);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selector-title"
    >
      <div className={styles.sheet}>
        <div className={styles.handleBar} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.titleBox}>
            <h2 id="role-selector-title">Chọn Vai Trò Sử Dụng</h2>
            <p>Hệ sinh thái chăm sóc gia đình DIA+ (3 chế độ chuyên biệt)</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label="Đóng bảng chọn vai trò"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {ROLES.map((role) => {
            const isSelected = activeRole === role.id;
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                className={`${styles.roleCard} ${role.cardClass} ${
                  isSelected ? styles.roleCardActive : ''
                }`}
                onClick={() => {
                  if (isSelected) {
                    close();
                  } else {
                    switchRole(role.id);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (isSelected) close();
                    else switchRole(role.id);
                  }
                }}
              >
                <div className={styles.cardHead}>
                  <div className={`${styles.iconOrb} ${role.orbClass}`}>
                    <Icon size={26} strokeWidth={2.2} />
                  </div>
                  <div className={styles.cardHeadText}>
                    <div className={styles.cardTopBadges}>
                      <span className={`${styles.tierPill} ${role.tierClass}`}>
                        {role.tierLabel}
                      </span>
                      {isSelected && (
                        <span className={styles.activeBadge}>
                          <Check size={12} strokeWidth={3} /> Đang sử dụng
                        </span>
                      )}
                    </div>
                    <h3 className={styles.roleName}>{role.name}</h3>
                    <p className={styles.roleTarget}>{role.target}</p>
                  </div>
                </div>

                <div className={styles.featureList}>
                  {role.features.map((feat, idx) => (
                    <div key={idx} className={styles.featureItem}>
                      <span className={styles.featureBullet}>•</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.cardActionRow}>
                  {isSelected ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#64748b',
                      }}
                    >
                      Bấm để tiếp tục ở chế độ này
                    </span>
                  ) : (
                    <button type="button" className={styles.switchBtn}>
                      Chuyển sang chế độ này <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className={styles.noteFooter}>
            💡 <strong>Mô hình đồng hành 3 bên:</strong> Bố/Mẹ là trung tâm điều trị · Hộ lý thực thi & ghi nhận hàng ngày · Con cháu an tâm theo dõi và bảo trợ từ xa.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
