import { useState } from 'react';
import { 
  X, Activity, Heart, AlertTriangle, CheckCircle2, Clock, 
  Pill, Calendar, Stethoscope, Phone, MessageSquare, 
  TrendingDown, TrendingUp, Minus, ArrowRight, UserCheck, ShieldAlert,
  FileText, Camera, ZoomIn, ZoomOut, RotateCw, Download, Maximize2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from './ClinicDashboardPage.module.css';

export default function PatientDetailModal({ patient, onClose, onUpdateNotes, onCheckout }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'meds', 'doctor_notes', 'prescription_photo'
  const [notesText, setNotesText] = useState(patient?.notes || '');
  const [nextAppDate, setNextAppDate] = useState(patient?.nextAppointment || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

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

          <button 
            className={`${styles.modalTabBtn} ${activeTab === 'prescription_photo' ? styles.activeModalTab : ''}`}
            onClick={() => setActiveTab('prescription_photo')}
            style={{ position: 'relative' }}
          >
            <Camera size={16} />
            <span>Ảnh chụp đơn thuốc gốc</span>
            {patient.prescriptionImage && (
              <span style={{ 
                background: '#2563eb', 
                color: '#fff', 
                fontSize: '10.5px', 
                fontWeight: '700', 
                padding: '1px 6px', 
                borderRadius: '8px', 
                marginLeft: '4px' 
              }}>
                Có ảnh
              </span>
            )}
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
            {patient.prescriptionImage && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#1e40af', fontWeight: '600' }}>
                  <Camera size={16} />
                  <span>Người bệnh có gửi kèm ảnh chụp đơn thuốc gốc của bệnh viện.</span>
                </div>
                <button 
                  onClick={() => setActiveTab('prescription_photo')}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Xem ảnh gốc ➔
                </button>
              </div>
            )}

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

        {/* Tab 4: 📸 Ảnh chụp đơn thuốc gốc của bệnh nhân */}
        {activeTab === 'prescription_photo' && (
          <div className={styles.tabContentArea}>
            {patient.prescriptionImage ? (
              <div>
                {/* Thanh thông tin trích xuất của đơn thuốc */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>🏥 Cơ sở y tế kê đơn</span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{patient.prescriptionHospital || 'Bệnh viện Đa khoa / Ngoại trú'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>👨‍⚕️ Bác sĩ kê đơn</span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{patient.prescriptionDoctor || 'Chưa ghi rõ'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>📅 Ngày kê đơn</span>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{patient.prescriptionDate || 'Gần đây'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>🩺 Chẩn đoán</span>
                    <strong style={{ fontSize: '13.5px', color: '#0284c7' }}>{patient.prescriptionDiagnosis || patient.diabetesType}</strong>
                  </div>
                </div>

                {/* Bố cục 2 cột: Cột trái ảnh chụp gốc, cột phải danh sách thuốc trích xuất */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  {/* Cột trái: Ảnh chụp gốc */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={18} color="#0284c7" />
                        Ảnh chụp đơn thuốc gốc
                      </h4>
                      <button 
                        onClick={() => { setShowLightbox(true); setZoomLevel(1); setRotation(0); }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Maximize2 size={13} /> Phóng to toàn màn hình
                      </button>
                    </div>

                    <div 
                      onClick={() => { setShowLightbox(true); setZoomLevel(1); setRotation(0); }}
                      style={{ 
                        position: 'relative', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        cursor: 'zoom-in',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        maxHeight: '380px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#0f172a'
                      }}
                      title="Bấm để phóng to xem chi tiết chữ ký & dấu mộc viện"
                    >
                      <img 
                        src={patient.prescriptionImage} 
                        alt="Đơn thuốc bệnh nhân" 
                        style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        padding: '12px 16px',
                        color: '#ffffff',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>🔍 Bấm vào ảnh để phóng to, xoay và đọc rõ nét</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Thuốc trích xuất đối chiếu */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={18} color="#16a34a" />
                      Thuốc AI đã nhận diện từ đơn
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                      {(!patient.medications || patient.medications.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                          Chưa có thông tin thuốc được trích xuất.
                        </div>
                      ) : (
                        patient.medications.map((m, idx) => (
                          <div key={idx} style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{m.name}</strong>
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                              Liều lượng: <strong>{m.dosage}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '1px' }}>
                              Cữ uống: {m.timing}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '12px', color: '#065f46' }}>
                      💡 Bác sĩ có thể đối chiếu mắt thường giữa ảnh chụp bên trái và danh sách thuốc bên phải để xác nhận phác đồ.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                <Camera size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                  Bệnh nhân chưa chụp tải lên ảnh đơn thuốc
                </h4>
                <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '500px', margin: '0 auto 16px' }}>
                  Khi người bệnh mở ứng dụng <strong>DIA+</strong> trên điện thoại và chọn chức năng <strong>"Quét đơn thuốc"</strong>, ảnh chụp gốc sẽ tự động gửi thẳng vào màn hình này của Bác sĩ.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lightbox / Zoom Modal cho Bác sĩ */}
        {showLightbox && patient.prescriptionImage && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => setShowLightbox(false)}
          >
            {/* Thanh công cụ Lightbox */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                background: 'rgba(30, 41, 59, 0.9)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#38bdf8" />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>
                  Ảnh đơn thuốc gốc: {patient.name} ({patient.code})
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Phóng to: {Math.round(zoomLevel * 100)}% • Góc xoay: {rotation}°
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                >
                  <ZoomIn size={16} /> Phóng to
                </button>
                <button 
                  onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                >
                  <ZoomOut size={16} /> Thu nhỏ
                </button>
                <button 
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                >
                  <RotateCw size={16} /> Xoay ảnh
                </button>
                <button 
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Mặc định
                </button>
                <a 
                  href={patient.prescriptionImage} 
                  download={`don-thuoc-${patient.code}.jpg`}
                  style={{ background: '#0284c7', textDecoration: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700' }}
                >
                  <Download size={16} /> Tải ảnh
                </a>
                <button 
                  onClick={() => setShowLightbox(false)}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', marginLeft: '8px' }}
                >
                  <X size={16} /> Đóng
                </button>
              </div>
            </div>

            {/* Khung hiển thị ảnh */}
            <div 
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '24px'
              }}
              onClick={() => setShowLightbox(false)}
            >
              <img 
                src={patient.prescriptionImage} 
                alt="Đơn thuốc phóng to"
                style={{
                  maxWidth: '90%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              />
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
