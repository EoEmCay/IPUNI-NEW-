import { useState, useMemo } from 'react';
import { Award, Flame, Calendar, Phone, Mail, User, ShieldAlert, CheckCircle2, Clock, X, HeartHandshake } from 'lucide-react';
import Modal from '../common/Modal';
import {
  calculateAdherenceStats,
  getCaregiverInfo,
  saveCaregiverInfo
} from '../../store/medicationAdherenceStore';

export default function MedicationHistoryModal({ medications = [], onClose }) {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'caregiver'
  const stats = useMemo(() => calculateAdherenceStats(medications, 7), [medications]);
  
  const [caregiver, setCaregiver] = useState(() => getCaregiverInfo());
  const [caregiverSaved, setCaregiverSaved] = useState(false);

  const handleSaveCaregiver = (e) => {
    e.preventDefault();
    saveCaregiverInfo(caregiver);
    setCaregiverSaved(true);
    setTimeout(() => setCaregiverSaved(false), 3000);
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
    <Modal title="Nhật Ký Uống Thuốc & Điểm Tuân Thủ" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 12, gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
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
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
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
                padding: '18px 20px',
                marginBottom: 16,
                boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Điểm Tuân Thủ (7 Ngày Qua)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: '#38BDF8' }}>{stats.score}%</span>
                    <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 100, background: 'rgba(56, 189, 248, 0.15)', color: '#7DD3FC', fontWeight: 700 }}>
                      {stats.rating.badge}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FB923C', fontWeight: 800, fontSize: 15 }}>
                    <Flame size={18} fill="#FB923C" /> {stats.streakDays} ngày
                  </div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>Chuỗi đúng giờ</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 100, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${stats.score}%`,
                      background: stats.score >= 85 ? '#22C55E' : stats.score >= 70 ? '#38BDF8' : '#EF4444',
                      borderRadius: 100,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
                  <span>Đã uống: <strong>{stats.totalTaken}</strong> / {stats.totalScheduled} cữ</span>
                  <span>Mục tiêu y khoa: &gt; 80%</span>
                </div>
              </div>
            </div>

            {/* Daily History List (7 Days) */}
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                      {idx === 0 ? 'Hôm nay' : idx === 1 ? 'Hôm qua' : day.dateLabel} ({day.date})
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: day.score === 100 ? '#DCFCE7' : day.score >= 50 ? '#FEF3C7' : '#FEE2E2',
                        color: day.score === 100 ? '#16A34A' : day.score >= 50 ? '#B45309' : '#DC2626'
                      }}
                    >
                      {day.score}% hoàn thành
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
                          fontSize: 12.5,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: m.status === 'taken' ? '#F0FDF4' : m.status === 'rest_day' ? '#F8FAFC' : '#FFFBEB'
                        }}
                      >
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          💊 {m.name} <span style={{ color: '#64748B', fontWeight: 400 }}>({m.dosage})</span>
                        </span>

                        {m.status === 'taken' ? (
                          <span style={{ color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} /> {m.takenAt ? `Đã uống ${m.takenAt}` : 'Đã uống'}
                          </span>
                        ) : m.status === 'rest_day' ? (
                          <span style={{ color: '#64748B', fontStyle: 'italic' }}>
                            📅 Nghỉ cữ
                          </span>
                        ) : (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>
                            Chưa uống
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
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HeartHandshake size={16} /> Tính năng Báo động Người nhà
              </div>
              <p style={{ fontSize: 12, color: '#3B82F6', margin: '4px 0 0', lineHeight: 1.4 }}>
                Khi bác quên uống thuốc quá 60 phút, hệ thống sẽ hỗ trợ gửi thông báo hoặc gọi điện tới người thân được cài đặt dưới đây để nhắc nhở kịp thời.
              </p>
            </div>

            <form onSubmit={handleSaveCaregiver} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Họ tên người thân
                </label>
                <input
                  type="text"
                  value={caregiver.name}
                  onChange={(e) => setCaregiver({ ...caregiver, name: e.target.value })}
                  placeholder="VD: Nguyễn Thị Lan Anh"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Mối quan hệ
                  </label>
                  <select
                    value={caregiver.relationship}
                    onChange={(e) => setCaregiver({ ...caregiver, relationship: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, background: 'white' }}
                  >
                    <option value="Con gái">Con gái</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Vợ/Chồng">Vợ/Chồng</option>
                    <option value="Người chăm sóc">Người chăm sóc</option>
                    <option value="Người thân khác">Người thân khác</option>
                  </select>
                </div>

                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Số điện thoại nhận tin
                  </label>
                  <input
                    type="tel"
                    value={caregiver.phone}
                    onChange={(e) => setCaregiver({ ...caregiver, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Email người thân (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={caregiver.email}
                  onChange={(e) => setCaregiver({ ...caregiver, email: e.target.value })}
                  placeholder="VD: lananh@gmail.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
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
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                {caregiverSaved ? '✓ Đã lưu thông tin người thân!' : 'Lưu Thông Tin Người Thân'}
              </button>
            </form>

            {caregiver.phone && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>
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
                      fontSize: 13,
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
                      fontSize: 13,
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
