import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mic,
  History,
  Settings,
  Palette,
  LogOut,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  ZoomIn,
  FileText,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useRoleModeStore from '../../store/roleModeStore';
import UserProfileModal from '../../components/layout/UserProfileModal';
import GiaoDienModal from '../../components/layout/GiaoDienModal';
import SecurityModal from '../../components/profile/SecurityModal';
import FontSizeModal from '../../components/profile/FontSizeModal';
import LegalModal from '../../components/profile/LegalModal';
import TimezoneUtcModal from '../../components/profile/TimezoneUtcModal';
import RoleCircleSwitcher from '../../components/common/RoleCircleSwitcher';
import styles from './TabPages.module.css';

const initials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(-2) || 'Đ+';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleMode = useRoleModeStore((s) => s.roleMode);
  const switchRole = useRoleModeStore((s) => s.switchRole);
  const openRoleSelector = useRoleModeStore((s) => s.openRoleSelector);

  const [modal, setModal] = useState(null); // 'profile' | 'theme'
  const [copiedCode, setCopiedCode] = useState(false);

  const isSupervisor = roleMode === 'supervisor';
  const isCaregiver = roleMode === 'caregiver';

  const copyCode = async () => {
    if (!user?.user_code) return;
    try {
      await navigator.clipboard.writeText(user.user_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    if (!window.confirm('Đăng xuất khỏi DIA+?')) return;
    logout();
    navigate('/');
  };

  // ── MENU DÀNH CHO CON CHÁU (SUPERVISOR) ──
  const supervisorItems = [
    {
      icon: User,
      label: 'Thông tin Người Giám Sát',
      desc: 'Họ tên, số điện thoại, tài khoản',
      onClick: () => setModal('profile'),
    },
    {
      icon: ShieldCheck,
      label: 'Đổi vai trò sử dụng (3 chế độ)',
      desc: 'Chuyển sang Bố/Mẹ (Người bệnh) hoặc Người chăm sóc (Hộ lý)',
      onClick: openRoleSelector,
    },
    {
      icon: Mic,
      label: 'Giọng nói nhắc nhở của con',
      desc: 'Ghi âm giọng của bạn để tự động phát khi Bố/Mẹ đến giờ uống thuốc',
      onClick: () => navigate('/voice'),
    },
    {
      icon: KeyRound,
      label: 'Bảo mật & Tài khoản',
      desc: 'Đổi mật khẩu, mã PIN bảo vệ, xác thực 2 lớp',
      onClick: () => setModal('security'),
    },
    {
      icon: ZoomIn,
      label: 'Cỡ chữ & Khả năng tiếp cận',
      desc: 'Tăng cỡ chữ (1x - 4x) hoạt động cả PC và Mobile',
      onClick: () => setModal('fontsize'),
    },
    {
      icon: FileText,
      label: 'Pháp lý & Quy định sử dụng',
      desc: 'Quy định app dành cho cả 2 đối tượng & bảo mật y tế',
      onClick: () => setModal('legal'),
    },
    {
      icon: Clock,
      label: 'Ngày giờ & Múi giờ (UTC)',
      desc: 'Đồng hồ chuẩn quốc tế UTC & giờ địa phương',
      onClick: () => setModal('utc'),
    },
  ];

  // ── MENU DÀNH CHO NGƯỜI CHĂM SÓC (CAREGIVER) ──
  const caregiverItems = [
    {
      icon: User,
      label: 'Thông tin Người Chăm Sóc (Hộ lý)',
      desc: 'Cô Lan · Đang phụ trách: Cụ Nguyễn Văn An',
      onClick: () => setModal('profile'),
    },
    {
      icon: ShieldCheck,
      label: 'Đổi vai trò sử dụng (3 chế độ)',
      desc: 'Chuyển sang Bố/Mẹ (Người bệnh) hoặc Con cháu (Giám sát)',
      onClick: openRoleSelector,
    },
    {
      icon: KeyRound,
      label: 'Bảo mật & Tài khoản',
      desc: 'Đổi mật khẩu, mã PIN ca trực',
      onClick: () => setModal('security'),
    },
    {
      icon: ZoomIn,
      label: 'Cỡ chữ & Khả năng tiếp cận',
      desc: 'Tăng cỡ chữ (1x - 4x) hiển thị rõ ràng trên điện thoại & máy tính',
      onClick: () => setModal('fontsize'),
    },
    {
      icon: FileText,
      label: 'Pháp lý & Quy định sử dụng',
      desc: 'Quy định trách nhiệm hộ lý & bảo mật dữ liệu y tế',
      onClick: () => setModal('legal'),
    },
    {
      icon: Clock,
      label: 'Ngày giờ & Múi giờ (UTC)',
      desc: 'Đồng hồ chuẩn quốc tế UTC & giờ địa phương',
      onClick: () => setModal('utc'),
    },
  ];

  // ── MENU DÀNH CHO BỆNH NHÂN (PATIENT) ──
  const patientItems = [
    {
      icon: User,
      label: 'Thông tin cá nhân',
      desc: 'Họ tên, số điện thoại, BHYT',
      onClick: () => setModal('profile'),
    },
    {
      icon: ShieldCheck,
      label: 'Đổi vai trò sử dụng (3 chế độ)',
      desc: 'Chuyển sang Người chăm sóc (Hộ lý) hoặc Con cháu (Giám sát)',
      onClick: openRoleSelector,
    },
    {
      icon: Mic,
      label: 'Giọng nhắc',
      desc: 'Ghi âm giọng người thân để nhắc uống thuốc',
      onClick: () => navigate('/voice'),
    },
    {
      icon: History,
      label: 'Lịch sử quét đơn',
      onClick: () => navigate('/scan-history'),
    },
    {
      icon: Palette,
      label: 'Giao diện',
      onClick: () => setModal('theme'),
    },
    {
      icon: FileText,
      label: 'Pháp lý & Quy định',
      desc: 'Quy định sử dụng app dành cho cả 2 đối tượng',
      onClick: () => setModal('legal'),
    },
    {
      icon: Settings,
      label: 'Cài đặt',
      desc: 'Cỡ chữ, thông báo nhắc thuốc',
      onClick: () => navigate('/settings'),
    },
  ];

  const items = isSupervisor ? supervisorItems : isCaregiver ? caregiverItems : patientItems;

  const roleTitle = isSupervisor
    ? 'Hồ Sơ Con Cháu (Giám Sát)'
    : isCaregiver
    ? 'Hồ Sơ Người Chăm Sóc (Hộ Lý)'
    : 'Hồ Sơ Bố / Mẹ (Bệnh Nhân)';

  const roleBadgeLabel = isSupervisor
    ? '🛡️ Con Cháu Giám Sát'
    : isCaregiver
    ? '👩‍⚕️ Hộ Lý Trực Tiếp'
    : '💊 Bệnh Nhân Đang Điều Trị';

  const roleBadgeBg = isSupervisor ? '#e0f2fe' : isCaregiver ? '#fef3c7' : '#dcfce7';
  const roleBadgeColor = isSupervisor ? '#0284c7' : isCaregiver ? '#b45309' : '#166534';

  // ── KHI Ở CHẾ ĐỘ HỘ LÝ: BỎ HẾT MENU PHỤ, CHỈ HIỆN TẤT CẢ THÔNG TIN ĐĂNG KÝ VỚI APP ──
  if (isCaregiver) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h1 className={styles.title}>Hồ Sơ Đăng Ký App</h1>
          <RoleCircleSwitcher />
        </div>

        {/* Thẻ định danh tài khoản Hộ Lý */}
        <div className={`${styles.card} ${styles.profileHead}`} style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className={styles.avatar} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
            Lan
          </span>
          <div style={{ flex: 1 }}>
            <p className={styles.name}>Cô Lan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 8px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                👩‍⚕️ Người Chăm Sóc Trực Tiếp
              </span>
              <span className={styles.meta}>0912 345 678</span>
            </div>
          </div>
        </div>

        {/* Khối Tất Cả Thông Tin Đăng Ký Với App */}
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              📋 Thông Tin Đăng Ký Ứng Dụng DIA+
            </h2>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              ✓ Đã xác thực
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Họ và tên người đăng ký:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>Cô Lan</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Vai trò hệ thống:</span>
              <span style={{ fontSize: 13.5, color: '#b45309', fontWeight: 700 }}>Người chăm sóc trực tiếp (Hộ lý tại nhà)</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Số điện thoại đăng ký:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>0912 345 678</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Email liên kết:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>caregiver.lan@gmail.com</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Mã định danh DIA+:</span>
              <span style={{ fontSize: 13.5, color: '#0284c7', fontWeight: 800 }}>DIA-CARE-2026</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Người bệnh phụ trách:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>Cụ Nguyễn Văn An (72 tuổi - Đái tháo đường Type 2 & Cao huyết áp)</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Người bảo trợ ủy quyền:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>Chị Trinh (Con trưởng - 0908 123 456)</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Gói dịch vụ kích hoạt:</span>
              <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 700 }}>DIA+ Đồng Hành Gia Đình (Family Care Companion)</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Quyền hạn trong ứng dụng:</span>
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 600, lineHeight: 1.45 }}>
                • Checklist chia & cho uống thuốc theo cữ<br />
                • Chụp ảnh máy đo huyết áp & đo đường huyết trực tiếp<br />
                • Ghi chép bữa ăn, giấc ngủ & gửi báo cáo hàng ngày
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.item} ${styles.logout}`}
            onClick={handleLogout}
            style={{ marginTop: 8, borderRadius: 14, border: '1px solid #fecaca', background: '#fff5f5' }}
          >
            <span className={styles.itemIcon}>
              <LogOut size={20} aria-hidden="true" color="#dc2626" />
            </span>
            <span className={styles.itemText} style={{ color: '#dc2626', fontWeight: 800 }}>Đăng xuất khỏi DIA+</span>
          </button>
        </div>

        <p className={styles.version}>
          Phiên bản {import.meta.env.VITE_BUILD_TIME || 'thử nghiệm'} · DIA+ Care System
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h1 className={styles.title}>{roleTitle}</h1>
        <button
          type="button"
          onClick={openRoleSelector}
          style={{
            fontSize: 12,
            fontWeight: 800,
            background: roleBadgeBg,
            color: roleBadgeColor,
            padding: '5px 11px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            border: 'none',
            cursor: 'pointer',
          }}
          title="Bấm để đổi vai trò"
        >
          <ShieldCheck size={14} /> Đổi vai trò ▾
        </button>
      </div>

      {/* Thẻ định danh tài khoản */}
      <div className={`${styles.card} ${styles.profileHead}`}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(user?.name)}
        </span>
        <div style={{ flex: 1 }}>
          <p className={styles.name}>
            {user?.name || (isSupervisor ? 'Con Gái Trinh' : isCaregiver ? 'Cô Lan (Hộ lý)' : 'Cụ Nguyễn Văn An')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                background: roleBadgeBg,
                color: roleBadgeColor,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {roleBadgeLabel}
            </span>
            <span className={styles.meta}>{user?.phone || user?.email || ''}</span>
          </div>

          {user?.user_code && (
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#475569',
              }}
            >
              <span>Mã DIA: <strong style={{ color: '#0284c7' }}>{user.user_code}</strong></span>
              <button
                type="button"
                onClick={copyCode}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0284c7',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="Sao chép mã"
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode ? 'Đã chép' : 'Chép'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nếu là Người Chăm Sóc: Thẻ tóm tắt người thân đang theo dõi */}
      {isSupervisor && (
        <div
          className={styles.card}
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
            👨‍👩‍👧 Đang theo dõi sức khỏe:
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            Bác Nguyễn Văn An (Bố ruột · 68 tuổi)
          </div>
          <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
            Chẩn đoán: Đái tháo đường Type 2 · Tăng huyết áp vô căn (Dữ liệu đồng bộ trực tiếp)
          </div>
        </div>
      )}

      {/* Danh mục menu chức năng */}
      <nav className={`${styles.card} ${styles.menu}`} aria-label="Hồ sơ">
        {items.map(({ icon: Icon, label, desc, onClick }) => (
          <button key={label} type="button" className={styles.item} onClick={onClick}>
            <span className={styles.itemIcon}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className={styles.itemText}>
              {label}
              {desc && <span className={styles.itemDesc}>{desc}</span>}
            </span>
            <ChevronRight size={20} className={styles.chevron} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          className={`${styles.item} ${styles.logout}`}
          onClick={handleLogout}
        >
          <span className={styles.itemIcon}>
            <LogOut size={22} aria-hidden="true" />
          </span>
          <span className={styles.itemText}>Đăng xuất</span>
        </button>
      </nav>

      <p className={styles.version}>
        Phiên bản {import.meta.env.VITE_BUILD_TIME || 'thử nghiệm'} · DIA+ Care System
      </p>

      {modal === 'profile' && <UserProfileModal onClose={() => setModal(null)} />}
      {modal === 'theme' && <GiaoDienModal onClose={() => setModal(null)} />}
      {modal === 'security' && <SecurityModal onClose={() => setModal(null)} />}
      {modal === 'fontsize' && <FontSizeModal onClose={() => setModal(null)} />}
      {modal === 'legal' && <LegalModal onClose={() => setModal(null)} />}
      {modal === 'utc' && <TimezoneUtcModal onClose={() => setModal(null)} />}
    </div>
  );
}
