import useRoleModeStore from '../../store/roleModeStore';
import SupervisorFamilyHub from '../../components/supervisor/SupervisorFamilyHub';
import CaregiverMedicalProfile from '../../components/caregiver/CaregiverMedicalProfile';
import FamilyCard from '../../components/settings/FamilyCard';
import TelegramCard from '../../components/settings/TelegramCard';
import RoleCircleSwitcher from '../../components/common/RoleCircleSwitcher';
import { ShieldCheck, HeartHandshake, Users } from 'lucide-react';

export default function FamilyPage() {
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const openRoleSelector = useRoleModeStore((s) => s.openRoleSelector);

  // Nếu đang ở Chế độ Người giám sát
  if (roleMode === 'supervisor') {
    return <SupervisorFamilyHub />;
  }

  // Nếu đang ở Chế độ Người chăm sóc (Hộ lý) -> Hiện Người chăm hiện tại, bệnh nền, lịch sử khám
  if (roleMode === 'caregiver') {
    return <CaregiverMedicalProfile />;
  }

  // Chế độ Người bệnh (Bố/Mẹ) hoặc Hộ lý
  return (
    <div
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingBottom: '96px',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <header
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#fff',
          borderRadius: 20,
          padding: '16px 18px',
          boxShadow: '0 6px 20px rgba(2, 132, 199, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(255,255,255,0.22)',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            <HeartHandshake size={14} /> GIA ĐÌNH ĐỒNG HÀNH
          </span>

          <RoleCircleSwitcher />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
            Kết Nối Gia Đình Cùng Bố/Mẹ
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#e0f2fe', lineHeight: 1.45 }}>
            Khi Bố/Mẹ kết nối mã với con cháu, người thân sẽ nhận được cảnh báo tự động khi quá giờ uống thuốc hoặc đường huyết bất thường.
          </p>
        </div>
      </header>

      {/* Thẻ Kết nối gia đình chuẩn */}
      <FamilyCard />

      {/* Thẻ Kênh Telegram thông báo */}
      <TelegramCard />
    </div>
  );
}
