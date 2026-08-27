import { useState } from 'react';
import { 
  X, Activity, Heart, AlertTriangle, CheckCircle2, Clock, 
  Pill, Calendar, Stethoscope, Phone, MessageSquare, 
  TrendingDown, TrendingUp, Minus, ArrowRight, UserCheck, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from './ClinicDashboardPage.module.css';

export default function PatientDetailModal({ patient, onClose, onUpdateNotes, onCheckout }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'meds', 'doctor_notes'
  const [notesText, setNotesText] = useState(patient?.notes || '');
  const [nextAppDate, setNextAppDate] = useState(patient?.nextAppointment || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!patient) return null;

  const handleSaveNotes = () => {
    onUpdateNotes(patient.id, notesText, nextAppDate);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const getGlucoseBadge = (val, status) => {
    if (val == null) {
      return <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>⚪ Chưa đo</span>;
    }
    if (status === 'emergency_low' || val < 3.9) {
      return <span className={`${styles.badge} ${styles.badgeEmergency}`}>🚨 {val} mmol/L (Hạ đường huyết cấp)</span>;
    }
    if (status === 'high' || val > 10.0) {
      return <span className={`${styles.badge} ${styles.badgeHigh}`}>🟠 {val} mmol/L (Đường huyết cao)</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeNormal}`}>🟢 {val} mmol/L (Trong mục tiêu)</span>;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.patientDetailCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.patientInfoTop}>
            <div className={styles.patientAvatarLarge}>
              {patient.gender === 'Nữ' ? '👩' : '👨'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  {patient.name}
                </h2>
                <span className={styles.patientCodeBadge}>{patient.code}</span>
                {patient.status === 'completed' ? (
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    Đã xuất viện / Hoàn thành
                  </span>
                ) : (
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    ● Đang khám tại phòng khám
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                {patient.gender} • {patient.age} tuổi • SĐT: <strong>{patient.phone}</strong> • Phân loại: <strong>{patient.diabetesType}</strong>
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Health Status Bar */}
        <div className={styles.quickStatusBar}>
          <div className={styles.quickStatBox}>
            <span className={styles.quickStatLabel}>Đường huyết mới nhất</span>
            <div style={{ marginTop: '4px' }}>
              {getGlucoseBadge(patient.currentGlucose, patient.glucoseStatus)}
            </div>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatLabel}>Chỉ số HbA1c gần nhất</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: patient.hba1c != null && patient.hba1c > 8.0 ? '#ea580c' : '#0284c7' }}>
              {patient.hba1c != null ? `${patient.hba1c}%` : '--'}
            </span>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatLabel}>Tuân thủ phác đồ thuốc</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {patient.adherenceScore != null ? (
                <>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: patient.adherenceScore >= 85 ? '#16a34a' : patient.adherenceScore >= 70 ? '#ca8a04' : '#dc2626' 
                  }}>
                    {patient.adherenceScore}%
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {patient.adherenceScore >= 85 ? '(Rất tốt)' : patient.adherenceScore >= 70 ? '(Trung bình)' : '(Kém/Quên cữ)'}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đơn thuốc</span>
              )}
            </div>
          </div>

          <div className={styles.quickStatBox}>
            <span className={styles.quickStatLabel}>Trạng thái thiết bị</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              {patient.deviceStatus === 'cgm_connected' && '🟢 Đang truyền CGM liên tục'}
              {patient.deviceStatus === 'ble_synced' && '🔵 Máy đo Bluetooth đã đồng bộ'}
              {patient.deviceStatus === 'disconnected' && '🔴 Mất kết nối > 5h'}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className={styles.modalTabs}>
          <button 
            className={`${styles.modalTabBtn} ${activeTab === 'chart' ? styles.activeModalTab : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <Activity size={16} />
            <span>Biến thiên đường huyết 24h</span>
          </button>

          <button 
            className={`${styles.modalTabBtn} ${activeTab === 'meds' ? styles.activeModalTab : ''}`}
            onClick={() => setActiveTab('meds')}
          >
            <Pill size={16} />
            <span>Tần suất & Lịch sử uống thuốc</span>
          </button>

          <button 
            className={`${styles.modalTabBtn} ${activeTab === 'doctor_notes' ? styles.activeModalTab : ''}`}
            onClick={() => setActiveTab('doctor_notes')}
          >
            <Stethoscope size={16} />
            <span>Chỉ định & Lời dặn Bác sĩ</span>
          </button>
        </div>

        {/* Tab 1: Biểu đồ đường huyết */}
        {activeTab === 'chart' && (
          <div className={styles.tabContentArea}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b' }}>
                📈 Đồ thị đo đường huyết liên tục (CGM 24 Giờ)
              </span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                  ■ Vùng mục tiêu an toàn (3.9 - 10.0 mmol/L)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                  ▲ Hạ đường huyết (&lt; 3.9)
                </span>
              </div>
            </div>

            {(!patient.glucoseHistory24h || patient.glucoseHistory24h.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                <Activity size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#334155', fontSize: '15px' }}>Bệnh nhân chưa có dữ liệu đo đường huyết 24h</p>
                <span style={{ fontSize: '13px' }}>Đồ thị sẽ tự động hiển thị khi người bệnh đo đường huyết trên App DIA+ hoặc kết nối cảm biến CGM.</span>
              </div>
            ) : (
              <div style={{ width: '100%', height: '240px', background: '#f8fafc', borderRadius: '16px', padding: '16px 12px 0 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patient.glucoseHistory24h}>
                    <defs>
                      <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[2, 16]} stroke="#94a3b8" fontSize={12} unit=" mmol" />
                    <Tooltip 
                      formatter={(val) => [`${val} mmol/L`, 'Đường huyết']}
                      contentStyle={{ borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <ReferenceLine y={10.0} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Ngưỡng cao (10.0)', fill: '#f97316', fontSize: 11 }} />
                    <ReferenceLine y={3.9} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ngưỡng hạ (3.9)', fill: '#ef4444', fontSize: 11 }} />
                    <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorGlucose)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '13px', color: '#0369a1' }}>
              💡 <strong>Nhận định chuyên môn:</strong> {patient.notes}
            </div>
          </div>
        )}

        {/* Tab 2: Tần suất & Lịch sử uống thuốc */}
        {activeTab === 'meds' && (
          <div className={styles.tabContentArea}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Đơn thuốc hiện tại */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={16} color="#0284c7" />
                  Đơn thuốc đang điều trị
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(!patient.medications || patient.medications.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '13px' }}>
                      Bệnh nhân chưa thêm hoặc quét đơn thuốc nào.
                    </div>
                  ) : (
                    patient.medications.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{m.name}</strong>
                          <div style={{ fontSize: '12.5px', color: '#64748b' }}>Liều: {m.dosage} • Cữ: {m.timing}</div>
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px', background: m.status === 'taken' ? '#dcfce7' : m.status === 'missed' ? '#fee2e2' : '#fef9c3', color: m.status === 'taken' ? '#15803d' : m.status === 'missed' ? '#b91c1c' : '#854d0e' }}>
                          {m.status === 'taken' ? 'Đã uống' : m.status === 'missed' ? 'Bỏ cữ' : 'Chờ uống'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tỷ lệ tuân thủ & Phân tích */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  📊 Điểm Tuân Thủ Phác Đồ: <span style={{ color: '#0284c7' }}>{patient.adherenceScore != null ? `${patient.adherenceScore}%` : 'Chưa có'}</span>
                </h4>
                {patient.adherenceScore != null ? (
                  <>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
                      <div style={{ 
                        width: `${patient.adherenceScore}%`, 
                        height: '100%', 
                        background: patient.adherenceScore >= 85 ? '#16a34a' : patient.adherenceScore >= 70 ? '#eab308' : '#dc2626' 
                      }}></div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                      {patient.adherenceScore >= 85 
                        ? 'Bệnh nhân có kỷ luật dùng thuốc rất cao. Ít khi quên cữ.' 
                        : 'Bệnh nhân thường xuyên quên cữ thuốc khi đi làm hoặc vào buổi tối, gây dao động đường huyết lớn.'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Chưa có đơn thuốc để tính điểm tuân thủ.</p>
                )}
              </div>
            </div>

            {/* Dòng thời gian nhật ký uống thuốc chi tiết */}
            <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
              📋 Dòng thời gian uống thuốc & tiêm insulin thực tế
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!patient.medicationLogs || patient.medicationLogs.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
                  Chưa có lịch sử ghi nhận uống thuốc.
                </div>
              ) : (
                patient.medicationLogs.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7', minWidth: '75px' }}>
                        🕒 {log.time}
                      </div>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{log.medName}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{log.note}</div>
                      </div>
                    </div>
                    <div>
                      {log.punctuality === 'on_time' && (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          🟢 Đúng giờ
                        </span>
                      )}
                      {log.punctuality === 'late' && (
                        <span style={{ background: '#fef9c3', color: '#854d0e', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          🟡 Uống trễ
                        </span>
                      )}
                      {log.punctuality === 'missed' && (
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          🔴 Bỏ lỡ cữ thuốc
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Chỉ định & Lời dặn Bác sĩ */}
        {activeTab === 'doctor_notes' && (
          <div className={styles.tabContentArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  🩺 Lời dặn & Phác đồ điều trị của Bác sĩ (Sẽ gửi trực tiếp sang App DIA+ của bệnh nhân):
                </label>
                <textarea
                  rows={4}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Nhập hướng dẫn điều trị, điều chỉnh liều insulin, chế độ ăn kiêng..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  📅 Ngày hẹn tái khám tiếp theo:
                </label>
                <input
                  type="date"
                  value={nextAppDate}
                  onChange={(e) => setNextAppDate(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={handleSaveNotes}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  Lưu & Gửi lời dặn sang App bệnh nhân
                </button>
                {isSaved && (
                  <span style={{ color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={18} /> Đã cập nhật thành công!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className={styles.modalFooter}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href={`tel:${patient.phone}`} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', fontWeight: '600', fontSize: '13.5px' }}
            >
              <Phone size={16} /> Gọi bệnh nhân
            </a>
            <button 
              onClick={() => alert(`Đã gửi tin nhắn SMS cảnh báo y tế đến bệnh nhân ${patient.name} (${patient.phone})`)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: '#f1f5f9', color: '#0f172a', border: 'none', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer' }}
            >
              <MessageSquare size={16} /> Nhắn SMS cảnh báo
            </button>
          </div>

          <div>
            {patient.status === 'active' ? (
              <button 
                onClick={() => {
                  if (window.confirm(`Xác nhận hoàn tất phiên khám và xuất viện cho bệnh nhân ${patient.name}?`)) {
                    onCheckout(patient.id);
                    onClose();
                  }
                }}
                style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserCheck size={16} /> Kết thúc đợt điều trị (Check-out)
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700' }}>
                <CheckCircle2 size={16} color="#16a34a" /> Đã hoàn tất khám ({patient.checkoutAt || 'Đã check-out'})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
