import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  Users,
  UserPlus,
  Copy,
  Check,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Pill,
  Droplet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMedications } from '../../hooks/useMedications';
import { useMetrics } from '../../hooks/useMetrics';
import useRoleModeStore from '../../store/roleModeStore';
import { careLinksService } from '../../services/careLinks.service';
import { triggerFamilyAlarm } from '../common/FamilyAlarmModal';
import { getNextAlarmPayloadForToday } from '../../store/medicationAdherenceStore';
import MemberHealthDossier from './MemberHealthDossier';
import TelegramCard from '../settings/TelegramCard';
import styles from './SupervisorFamilyHub.module.css';

export default function SupervisorFamilyHub() {
  const { user } = useAuth();
  const { medications, todayMedications, fetchToday, fetchMedications } = useMedications();
  const { metrics, fetchMetrics } = useMetrics();

  const deviceMode = useRoleModeStore((s) => s.deviceMode);
  const setDeviceMode = useRoleModeStore((s) => s.setDeviceMode);
  const switchRole = useRoleModeStore((s) => s.switchRole);
  const callerTitle = useRoleModeStore((s) => s.callerTitle);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null); // { ok: boolean, text: string }
  const [copiedCode, setCopiedCode] = useState(false);

  // ID của thành viên đang được chọn (đối với giao diện PC 2 cột)
  const [selectedMemberId, setSelectedMemberId] = useState(user?.id || 'primary_patient');

  // Thành viên đang được xem chi tiết trên Mobile Modal
  const [activeModalMember, setActiveModalMember] = useState(null);

  const loadMembers = () => {
    setLoading(true);
    careLinksService
      .getFamilyMembers()
      .then((res) => {
        setMembers(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
    fetchToday();
    fetchMedications().catch(() => {});
    fetchMetrics(undefined, 30).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Xây dựng danh mục đầy đủ các thành viên đã kết nối
  // Người dùng đăng nhập (user) là NGƯỜI CHĂM SÓC (Caregiver)
  // Danh mục dưới đây là các BỆNH NHÂN / NGƯỜI THÂN đang được chăm sóc
  const allMembers = useMemo(() => {
    const list = [];
    // 1. Hồ sơ bệnh nhân chính đang theo dõi (Bố/Mẹ)
    list.push({
      id: 'primary_patient',
      name: 'Bác Nguyễn Văn An',
      relationship: 'Bố ruột (Đang giám sát chính)',
      user_code: 'DIABO8829',
      phone: '0908 123 456',
      birthYear: 1958,
      gender: 'Nam',
      bhyt: 'GD 4 79 1234567890',
      diagnosis: 'Đái tháo đường Type 2 (E11) · Tăng huyết áp vô căn (I10)',
      doctor: 'BS. CKI Nguyễn Văn Hoàng (BV ĐHYD TP.HCM)',
      nextAppointment: 'Thứ Ba, 24/10/2026 · 08:30 sáng',
      hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
      isPrimary: true,
      caregiverName: user?.name || 'Khôi Lê',
      caregiverCode: user?.user_code || 'DIAE3Q5EA',
    });

    // 2. Thêm các người thân đã liên kết từ server
    (members || []).forEach((m) => {
      if (m.id !== user?.id) {
        list.push({
          id: m.id,
          name: m.name || 'Người nhà',
          relationship: 'Người thân kết nối',
          user_code: m.user_code,
          phone: m.phone || 'Chưa cập nhật',
          birthYear: 1962,
          gender: 'Nữ',
          bhyt: 'GD 4 79 9876543210',
          diagnosis: 'Đái tháo đường Type 2 (Giai đoạn ổn định)',
          doctor: 'BS. CKI Lê Quang Vinh',
          nextAppointment: 'Thứ Năm, 12/11/2026 · 09:00 sáng',
          hospital: 'BV Chợ Rẫy TP.HCM',
          isPrimary: false,
          caregiverName: user?.name || 'Khôi Lê',
        });
      }
    });

    return list;
  }, [user, members]);

  // Thành viên đang được chọn trên PC
  const currentSelectedMember = useMemo(() => {
    return allMembers.find((m) => m.id === selectedMemberId) || allMembers[0];
  }, [allMembers, selectedMemberId]);

  const copyMyCode = async () => {
    if (!user?.user_code) return;
    try {
      await navigator.clipboard.writeText(user.user_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    setJoinBusy(true);
    setJoinMsg(null);
    try {
      const res = await careLinksService.joinFamily(clean);
      const newMember = res.data?.data;
      setJoinMsg({
        ok: true,
        text: `Đã kết nối thành công với ${newMember?.name || 'người thân'}!`,
      });
      setJoinCode('');
      loadMembers();
    } catch (err) {
      setJoinMsg({
        ok: false,
        text: err?.response?.data?.message || 'Không tìm thấy tài khoản với mã này.',
      });
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeaveFamily = async (member) => {
    if (member.isPrimary) {
      alert('Đây là hồ sơ người thân chính đang được giám sát trên ứng dụng.');
      return;
    }
    if (!window.confirm(`Gỡ kết nối giám sát với ${member.name}?`)) return;
    try {
      await careLinksService.leaveFamily(member.id);
      loadMembers();
      if (selectedMemberId === member.id) {
        setSelectedMemberId(allMembers[0]?.id);
      }
    } catch {
      /* ignore */
    }
  };

  const handleTriggerAlarm = (targetMember) => {
    // Chỉ phát âm thanh chuông nhắc thuốc đến thiết bị của bố, không mở modal che màn hình
    voiceAlertService.playAlert(
      ALERT_TYPES.MED_ALL,
      'Bố ơi, đến giờ uống thuốc rồi ạ!'
    );
  };

  const isPc = deviceMode === 'pc';

  return (
    <div className={styles.container}>
      {/* ── Top Bar: Role badge + PC/Mobile toggle + Flip Role ── */}
      <header className={styles.topControlBar}>
        <div className={styles.titleArea}>
          <div className={styles.badgeRow}>
            <span className={styles.roleBadge}>
              <ShieldCheck size={14} /> NGƯỜI GIÁM SÁT
            </span>
            <span className={styles.liveDot}>
              <span className={styles.pulseCircle} /> {allMembers.length} Người thân kết nối
            </span>
          </div>
          <h1 className={styles.pageTitle}>Trung Tâm Gia Đình & Hồ Sơ Giám Sát</h1>
        </div>

        <div className={styles.switchersArea}>
          {/* Nút chuyển PC / Mobile */}
          <div
            className={styles.devicePill}
            role="group"
            aria-label="Chuyển chế độ PC hoặc Điện thoại"
          >
            <button
              type="button"
              className={`${styles.deviceBtn} ${
                deviceMode === 'mobile' ? styles.deviceBtnActive : ''
              }`}
              onClick={() => setDeviceMode('mobile')}
              title="Chế độ điện thoại dọc"
            >
              <Smartphone size={14} /> Mobile
            </button>
            <button
              type="button"
              className={`${styles.deviceBtn} ${deviceMode === 'pc' ? styles.deviceBtnActive : ''}`}
              onClick={() => setDeviceMode('pc')}
              title="Chế độ PC màn hình rộng"
            >
              <Monitor size={14} /> PC
            </button>
          </div>

          {/* Nút Xoay 3D về màn hình Bố/Mẹ */}
          <button
            type="button"
            className={styles.flipRoleBtn}
            onClick={() => switchRole('patient')}
            title="Quay lại giao diện dành cho Bố/Mẹ"
          >
            <RotateCcw size={14} /> Về Bố/Mẹ
          </button>
        </div>
      </header>

      {/* ── Bố Cục: 2 Cột Trên PC hoặc 1 Cột Trên Mobile ── */}
      <div className={`${styles.layoutGrid} ${isPc ? styles.pcLayoutGrid : ''}`}>
        {/* CỘT TRÁI: Danh Mục Thành Viên Đã Kết Nối + Thêm Thành Viên */}
        <div className={styles.columnLeft}>
          {/* Danh mục những cái tên đã kết nối */}
          <section className={styles.catalogCard}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Users size={18} color="#0284c7" /> Danh Mục Người Thân
              </h2>
              <span className={styles.countBadge}>{allMembers.length} người</span>
            </div>

            <div className={styles.membersList}>
              {allMembers.map((m) => {
                const isSelected = isPc && selectedMemberId === m.id;
                const initials = m.name
                  ? m.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(-2)
                  : 'BN';

                return (
                  <div
                    key={m.id}
                    className={`${styles.memberCard} ${isSelected ? styles.memberCardActive : ''}`}
                    onClick={() => {
                      if (isPc) setSelectedMemberId(m.id);
                    }}
                    style={{ cursor: isPc ? 'pointer' : 'default' }}
                  >
                    <div className={styles.memberMainRow}>
                      <div className={styles.memberAvatar}>{initials}</div>
                      <div className={styles.memberDetails}>
                        <h3 className={styles.memberName}>
                          {m.name}
                          <span className={styles.relTag}>{m.relationship}</span>
                        </h3>
                        <p className={styles.memberCode}>Mã DIA: {m.user_code}</p>
                      </div>
                      {!m.isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveFamily(m);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                          title={`Gỡ kết nối với ${m.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Dòng tóm tắt nhanh tình trạng uống thuốc & đường huyết */}
                    <div className={styles.memberStatsRow}>
                      <span className={styles.memberStatChip}>
                        <Pill size={12} color="#0284c7" /> 3/4 cử hôm nay
                      </span>
                      <span className={styles.memberStatChip}>
                        <Droplet size={12} color="#dc2626" /> 6.8 mmol/L
                      </span>
                    </div>

                    {/* Nút Xem Hồ Sơ */}
                    <button
                      type="button"
                      className={`${styles.viewProfileBtn} ${
                        isPc && isSelected ? styles.viewProfileBtnOutline : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPc) {
                          setSelectedMemberId(m.id);
                        } else {
                          setActiveModalMember(m);
                        }
                      }}
                    >
                      <Eye size={15} />
                      {isPc && isSelected ? '✓ Đang xem hồ sơ' : 'Xem hồ sơ sức khỏe'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Form Kết Nối Mã Gia Đình Mới */}
          <section className={styles.connectCard}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <UserPlus size={18} color="#0284c7" /> Kết Nối Người Thân Mới
              </h2>
            </div>

            {/* Mã của Người Giám Sát */}
            {user?.user_code && (
              <div className={styles.myCodeBox}>
                <div>
                  <span className={styles.codeLabel}>
                    Mã DIA Người Chăm Sóc ({user?.name || 'Khôi Lê'}):
                  </span>
                  <span className={styles.codeValue}>{user.user_code}</span>
                </div>
                <button
                  type="button"
                  className={styles.copyCodeBtn}
                  onClick={copyMyCode}
                  title="Sao chép mã"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCode ? 'Đã chép' : 'Chép mã'}
                </button>
              </div>
            )}

            {/* Form Nhập Mã Người Nhà */}
            <form className={styles.joinForm} onSubmit={handleJoinFamily}>
              <label htmlFor="join-family-input" style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                Nhập mã DIA của Bố/Mẹ hoặc người thân:
              </label>
              <input
                id="join-family-input"
                className={styles.inputField}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinMsg(null);
                }}
                placeholder="VD: DIA7K2M9P"
                maxLength={15}
                autoCapitalize="characters"
              />

              {joinMsg && (
                <div
                  className={`${styles.toastMsg} ${
                    joinMsg.ok ? styles.toastSuccess : styles.toastError
                  }`}
                >
                  {joinMsg.text}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={joinBusy || joinCode.trim().length < 4}
              >
                {joinBusy ? 'Đang kết nối...' : '+ Kết nối thêm người thân'}
              </button>
            </form>
          </section>

          {/* Kênh thông báo qua Telegram */}
          <TelegramCard />
        </div>

        {/* CỘT PHẢI (CHỈ HIỂN THỊ TRÊN PC): Hồ Sơ Sức Khỏe Chi Tiết Trực Tiếp */}
        {isPc && (
          <div className={styles.columnRight}>
            <MemberHealthDossier
              member={currentSelectedMember}
              medications={medications}
              todayMedications={todayMedications}
              metrics={metrics}
              onTriggerAlarm={handleTriggerAlarm}
            />
          </div>
        )}
      </div>

      {/* ── MODAL XEM HỒ SƠ TRÊN MOBILE (Khi bấm "Xem hồ sơ" ở chế độ Mobile) ── */}
      {!isPc && activeModalMember && (
        <div
          className={styles.mobileModalOverlay}
          onClick={() => setActiveModalMember(null)}
        >
          <div
            className={styles.mobileModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <MemberHealthDossier
              member={activeModalMember}
              medications={medications}
              todayMedications={todayMedications}
              metrics={metrics}
              onClose={() => setActiveModalMember(null)}
              onTriggerAlarm={handleTriggerAlarm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
