import { useState, useMemo, useEffect, useRef } from 'react';
import { Award, Flame, Calendar, Phone, Mail, User, ShieldAlert, CheckCircle2, Clock, X, HeartHandshake } from 'lucide-react';
import Modal from '../common/Modal';
import useMedicationsStore from '../../store/medicationsStore';
import {
  calculateAdherenceStats,
  getCaregiverInfo,
  saveCaregiverInfo
} from '../../store/medicationAdherenceStore';
import { careLinksService } from '../../services/careLinks.service';

export default function MedicationHistoryModal({ medications = [], onClose, initialTab = 'stats' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'stats' | 'caregiver'
  const statusVersion = useMedicationsStore((s) => s.statusVersion);
  const medicationStatus = useMedicationsStore((s) => s.medicationStatus);
  const stats = useMemo(
    () => calculateAdherenceStats(medications, 7),
    [medications, statusVersion, medicationStatus] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [caregiver, setCaregiver] = useState(() => getCaregiverInfo());
  const [caregiverSaved, setCaregiverSaved] = useState(false);
  const [caregiverSyncing, setCaregiverSyncing] = useState(false);
  const fetchedRef = useRef(false);

  // Khi mở tab "Người nhà" lần đầu: nạp dữ liệu mới nhất từ backend (bảng care_links) — dữ liệu
  // này có thể được đồng bộ từ thiết bị/phiên khác, không chỉ nằm trong localStorage của máy này.
  useEffect(() => {
    if (activeTab !== 'caregiver' || fetchedRef.current) return;
    fetchedRef.current = true;
    setCaregiverSyncing(true);
    careLinksService.getFamily()
      .then((res) => {
        const link = (res.data.data || [])[0];
        if (link) {
          const merged = {
            name: link.display_name || '',
            phone: link.contact_phone || '',
            email: link.contact_email || '',
            // "Mối quan hệ" chỉ là gợi ý hiển thị cục bộ — bảng care_links (tầng cảnh báo lâm
            // sàng) không lưu trường này, nên giữ nguyên lựa chọn đã lưu trên máy nếu có.
            relationship: caregiver.relationship || 'Con/Người thân',
          };
          setCaregiver(merged);
          saveCaregiverInfo(merged); // đồng bộ ngược vào localStorage để dùng offline lần sau
        }
      })
      .catch(() => { /* offline hoặc lỗi mạng — cứ giữ dữ liệu localStorage hiện có */ })
      .finally(() => setCaregiverSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSaveCaregiver = (e) => {
    e.preventDefault();
    // Luôn lưu localStorage trước (tức thì, hoạt động cả khi offline)
    saveCaregiverInfo(caregiver);
    setCaregiverSaved(true);
    setTimeout(() => setCaregiverSaved(false), 3000);

    // Đồng bộ lên backend vào bảng care_links để missedDoseChecker/caregiverNotify dùng được
    // trên MỌI thiết bị (không chỉ máy đang lưu) — lỗi mạng thì bỏ qua, đã có localStorage dự phòng.
    careLinksService.saveFamily({
      display_name: caregiver.name,
      contact_email: caregiver.email || '',
      contact_phone: caregiver.phone || '',
    }).catch(() => { /* offline — dữ liệu vẫn an toàn trong localStorage, sẽ thử lại lần lưu sau */ });
  };

  const handleCallCaregiver = () => {
    if (!caregiver.phone) {
      alert('Vui lòng nhập số điện thoại người nhà trước!');
      setActiveTab('caregiver');
      return;
    }
    window.location.href = `tel:${caregiver.phone}`;
  };

  const handleSendSms = () => {
    if (!caregiver.phone) {
      alert('Vui lòng nhập số điện thoại người nhà trước!');
      setActiveTab('caregiver');
      return;
    }
    const msg = encodeURIComponent(
      `[DIA+] Bác ơi, con thấy trên ứng dụng báo cữ thuốc hôm nay chưa được đánh dấu uống. Bác nhớ kiểm tra và uống thuốc đúng giờ nhé!`
    );
    window.location.href = `sms:${caregiver.phone}?body=${msg}`;
  };

  return (
    <Modal title="Nhật Ký Uống Thuốc & Tuân Thủ" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 12, gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeTab === 'stats' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'stats' ? '#1E293B' : '#64748B',
              boxShadow: activeTab === 'stats' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📊 Điểm số & Lịch sử
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('caregiver')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeTab === 'caregiver' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'caregiver' ? '#1E293B' : '#64748B',
              boxShadow: activeTab === 'caregiver' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            👥 Người nhà nhắc nhở
          </button>
        </div>

        {activeTab === 'stats' ? (
          <div>
            {/* Score & Streak Header Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: 'white',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 16,
                boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: '#94A3B8',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Điểm Tuân Thủ (7 Ngày Qua)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#38BDF8', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                      {stats.score}%
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: 13.5,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#7DD3FC',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stats.rating.badge}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 12px',
                    borderRadius: 12,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 5,
                      color: '#FB923C',
                      fontWeight: 800,
                      fontSize: 16,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Flame size={17} fill="#FB923C" style={{ flexShrink: 0 }} /> {stats.streakDays} ngày
                  </div>
                  <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 2, whiteSpace: 'nowrap' }}>
                    Chuỗi đúng giờ
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 100, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, stats.score)}%`,
                      background: stats.score >= 85 ? '#22C55E' : stats.score >= 70 ? '#38BDF8' : '#EF4444',
                      borderRadius: 100,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13.5,
                    color: '#94A3B8',
                    marginTop: 6,
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>
                    Đã uống: <strong style={{ color: '#F8FAFC' }}>{stats.totalTaken}</strong> / {stats.totalScheduled} cử
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>Mục tiêu y khoa: &gt; 80%</span>
                </div>
              </div>
            </div>

            {/* Biểu đồ cột 7 ngày (cũ -> mới), cùng nguồn số liệu với danh sách bên dưới */}
            <div
              role="img"
              aria-label={`Biểu đồ tuân thủ 7 ngày: ${[...stats.history].reverse().map((d) => `${d.dateLabel} ${d.scheduled ? `${d.score}%` : 'không có cữ'}`).join(', ')}`}
              style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, marginBottom: 18, padding: '0 2px' }}
            >
              {[...stats.history].reverse().map((day, i, arr) => {
                const none = day.scheduled === 0;
                // Hôm nay chưa hết ngày -> chưa đủ cữ là "đang diễn ra" (xanh dương), không tô đỏ gây hoảng
                const isToday = i === arr.length - 1;
                const color = none ? '#CBD5E1' : day.score === 100 ? '#16A34A' : isToday ? '#0EA5E9' : day.score >= 50 ? '#F59E0B' : '#DC2626';
                return (
                  <div key={day.date} aria-hidden="true" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: none ? '#94A3B8' : '#1E293B',
                        whiteSpace: 'nowrap',
                        letterSpacing: -0.3,
                      }}
                    >
                      {none ? '—' : `${day.score}%`}
                    </span>
                    <div style={{ width: '100%', maxWidth: 34, height: `${none ? 4 : Math.max(day.score, 4)}%`, background: color, borderRadius: '6px 6px 0 0', marginTop: 4 }} />
                    <span
                      style={{
                        fontSize: 13.5,
                        color: '#475569',
                        marginTop: 6,
                        fontWeight: isToday ? 800 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isToday ? 'Nay' : new Date(`${day.date}T00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Daily History List (7 Days) */}
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color="#2563EB" /> Chi Tiết 7 Ngày Qua
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {stats.history.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15.5, color: '#1E293B', whiteSpace: 'nowrap' }}>
                      {idx === 0 ? 'Hôm nay' : idx === 1 ? 'Hôm qua' : day.dateLabel} ({day.date})
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        background:
                          day.score === 100
                            ? '#DCFCE7'
                            : day.score >= 50
                            ? '#FEF3C7'
                            : day.taken > 0
                            ? '#E0F2FE'
                            : '#FEE2E2',
                        color:
                          day.score === 100
                            ? '#16A34A'
                            : day.score >= 50
                            ? '#B45309'
                            : day.taken > 0
                            ? '#0369A1'
                            : '#DC2626',
                      }}
                    >
                      {day.score}% hoàn thành ({day.taken}/{day.scheduled} cử)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {day.medications.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14.5,
                          padding: '6px 8px',
                          borderRadius: 8,
                          background:
                            m.status === 'taken'
                              ? '#F0FDF4'
                              : m.status === 'partial'
                              ? '#F0F9FF'
                              : m.status === 'rest_day'
                              ? '#F8FAFC'
                              : '#FFFBEB',
                        }}
                      >
                        <span
                          style={{
                            color: '#1E293B',
                            fontWeight: 700,
                            minWidth: 0,
                            flex: 1,
                            lineHeight: 1.35,
                            wordBreak: 'keep-all',
                          }}
                        >
                          💊 {m.name}{' '}
                          {m.dosage && (
                            <span
                              style={{
                                color: '#64748B',
                                fontWeight: 500,
                                fontSize: 13.5,
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                              }}
                            >
                              ({m.dosage})
                            </span>
                          )}
                        </span>

                        {m.status === 'taken' ? (
                          <span
                            style={{
                              color: '#16A34A',
                              fontWeight: 700,
                              fontSize: 13.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />{' '}
                            {m.takenSummary || (m.takenAt ? `Đã uống ${m.takenAt}` : 'Đã uống')}
                          </span>
                        ) : m.status === 'partial' ? (
                          <span
                            style={{
                              color: '#0369A1',
                              background: '#E0F2FE',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontWeight: 700,
                              fontSize: 13,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            <Clock size={13} style={{ flexShrink: 0 }} /> {m.takenSummary}
                          </span>
                        ) : m.status === 'rest_day' ? (
                          <span
                            style={{
                              color: '#64748B',
                              fontStyle: 'italic',
                              fontSize: 13.5,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            📅 Nghỉ cữ
                          </span>
                        ) : (
                          <span
                            style={{
                              color: '#D97706',
                              fontWeight: 700,
                              fontSize: 13.5,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {m.totalSlots > 1 ? `Chưa uống (0/${m.totalSlots} cử)` : 'Chưa uống'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Caregiver Notification Settings Tab */
          <div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 14px', borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HeartHandshake size={16} /> Tính năng Báo động Người nhà
                {caregiverSyncing && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6', marginLeft: 'auto' }}>
                    Đang đồng bộ…
                  </span>
                )}
              </div>
              <p style={{ fontSize: 15, color: '#3B82F6', margin: '4px 0 0', lineHeight: 1.4 }}>
                Khi bác quên uống thuốc quá 60 phút, hệ thống sẽ hỗ trợ gửi thông báo hoặc gọi điện tới người thân được cài đặt dưới đây để nhắc nhở kịp thời.
              </p>
            </div>

            <form onSubmit={handleSaveCaregiver} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Họ tên người thân
                </label>
                <input
                  type="text"
                  value={caregiver.name}
                  onChange={(e) => setCaregiver({ ...caregiver, name: e.target.value })}
                  placeholder="VD: Nguyễn Thị Lan Anh"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 17 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Mối quan hệ
                  </label>
                  <select
                    value={caregiver.relationship}
                    onChange={(e) => setCaregiver({ ...caregiver, relationship: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 17, background: 'white' }}
                  >
                    <option value="Con gái">Con gái</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Vợ/Chồng">Vợ/Chồng</option>
                    <option value="Người chăm sóc">Người chăm sóc</option>
                    <option value="Người thân khác">Người thân khác</option>
                  </select>
                </div>

                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Số điện thoại nhận tin
                  </label>
                  <input
                    type="tel"
                    value={caregiver.phone}
                    onChange={(e) => setCaregiver({ ...caregiver, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 17 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Email người thân (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={caregiver.email}
                  onChange={(e) => setCaregiver({ ...caregiver, email: e.target.value })}
                  placeholder="VD: lananh@gmail.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 17 }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  padding: '12px',
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: 'pointer'
                }}
              >
                {caregiverSaved ? '✓ Đã lưu thông tin người thân!' : 'Lưu Thông Tin Người Thân'}
              </button>
            </form>

            {caregiver.phone && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>
                  Thao tác nhanh khẩn cấp:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCallCaregiver}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#16A34A',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <Phone size={15} /> Gọi cho {caregiver.name || 'Người nhà'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendSms}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <Mail size={15} /> Gửi SMS Nhắc
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
