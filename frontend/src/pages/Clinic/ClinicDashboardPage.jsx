import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Users, AlertCircle, Heart, Bell, QrCode, Search, 
  RefreshCw, CheckCircle2, TrendingDown, TrendingUp, Minus, 
  Clock, ShieldAlert, LogOut, ChevronRight, Filter, X, Smartphone, ArrowUpRight
} from 'lucide-react';
import { clinicService } from './clinicService';
import PatientDetailModal from './PatientDetailModal';
import ClinicQRCodeModal from './ClinicQRCodeModal';
import styles from './ClinicDashboardPage.module.css';

export default function ClinicDashboardPage() {
  const navigate = useNavigate();
  const [clinicProfile, setClinicProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'active', 'completed', 'emergency', 'meds_warning', 'normal', 'disconnected'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkoutToast, setCheckoutToast] = useState(null);
  const prevPatientStatusRef = useRef({});

  // Load data
  const loadData = useCallback(() => {
    setClinicProfile(clinicService.getClinicProfile());
    setPatients(clinicService.getPatients());
    setNotifications(clinicService.getNotifications());

    // Fetch live cloud patients
    clinicService.fetchPatientsFromCloud().then((cloudList) => {
      if (Array.isArray(cloudList)) {
        setPatients(cloudList);
      }
    });
  }, []);

  // Detect status change from active -> completed for real-time notification
  useEffect(() => {
    patients.forEach(p => {
      const key = p.id || p.code;
      const prev = prevPatientStatusRef.current[key];
      if (prev && prev === 'active' && p.status === 'completed') {
        setCheckoutToast(`🚪 Bệnh nhân ${p.name} (${p.code}) vừa bấm kết thúc đợt khám & check-out khỏi phòng khám!`);
        setTimeout(() => setCheckoutToast(null), 8000);
      }
      prevPatientStatusRef.current[key] = p.status;
    });
  }, [patients]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Poll cloud every 2 seconds for real-time check-ins from phones on diaplus.vn
    const cloudPoll = setInterval(() => {
      clinicService.fetchPatientsFromCloud().then((cloudList) => {
        if (Array.isArray(cloudList)) {
          setPatients(cloudList);
        }
      });
    }, 2000);

    const handleSync = (e) => {
      loadData();
      if (e?.detail?.type === 'PATIENT_CHECKOUT' || e?.detail?.type === 'PATIENT_LEAVE') {
        const name = e.detail?.payload?.patientName || 'Bệnh nhân';
        setCheckoutToast(`🚪 ${name} vừa bấm kết thúc đợt khám & check-out khỏi phòng khám!`);
        setTimeout(() => setCheckoutToast(null), 8000);
      } else if (e?.detail?.type === 'PATIENT_PRESCRIPTION_UPLOADED') {
        const name = e.detail?.payload?.patientName || 'Bệnh nhân';
        setCheckoutToast(`📸 ${name} vừa chụp quét một đơn thuốc mới! Bấm vào hồ sơ để xem ảnh gốc.`);
        setTimeout(() => setCheckoutToast(null), 10000);
      }
    };
    window.addEventListener('clinicSyncEvent', handleSync);
    window.addEventListener('storage', handleSync);

    let channel = null;
    try {
      channel = new BroadcastChannel('diaplus_clinic_sync_channel');
      channel.onmessage = (e) => {
        loadData();
        if (e.data?.type === 'PATIENT_CHECKIN') {
          // Play arrival chime
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch {}
        } else if (e.data?.type === 'PATIENT_CHECKOUT' || e.data?.type === 'PATIENT_LEAVE') {
          const name = e.data?.payload?.patientName || 'Bệnh nhân';
          setCheckoutToast(`🚪 ${name} vừa bấm kết thúc đợt khám & check-out khỏi phòng khám!`);
          setTimeout(() => setCheckoutToast(null), 8000);
        } else if (e.data?.type === 'PATIENT_PRESCRIPTION_UPLOADED') {
          const name = e.data?.payload?.patientName || 'Bệnh nhân';
          setCheckoutToast(`📸 ${name} vừa chụp quét một đơn thuốc mới! Bấm vào hồ sơ để xem ảnh gốc.`);
          setTimeout(() => setCheckoutToast(null), 10000);
        }
      };
    } catch {}

    return () => {
      clearInterval(timer);
      clearInterval(cloudPoll);
      window.removeEventListener('clinicSyncEvent', handleSync);
      window.removeEventListener('storage', handleSync);
      if (channel) channel.close();
    };
  }, [loadData]);

  // Handlers
  const handleUpdateNotes = (patientId, notes, nextApp) => {
    const updated = clinicService.updatePatientNotes(patientId, notes, nextApp);
    loadData();
    if (selectedPatient && selectedPatient.id === patientId) {
      setSelectedPatient(updated);
    }
  };

  const handleCheckout = (patientId) => {
    clinicService.checkoutPatient(patientId);
    loadData();
  };

  const handleClearAll = () => {
    if (window.confirm('Xóa sạch danh sách bệnh nhân để kiểm tra quét mã QR thật?')) {
      clinicService.clearAllPatients();
      loadData();
    }
  };

  const handleLoadDemo = () => {
    clinicService.loadMockDemoData();
    loadData();
  };

  // KPIs
  const kpis = useMemo(() => {
    const activePatients = patients.filter(p => p.status === 'active');
    const completedPatients = patients.filter(p => p.status === 'completed');
    const emergencyCases = activePatients.filter(p => p.currentGlucose != null && (p.glucoseStatus === 'emergency_low' || p.currentGlucose < 3.9));
    const medsWarnings = activePatients.filter(p => p.adherenceScore != null && p.adherenceScore < 70);
    const overdueCount = patients.filter(p => p.status === 'overdue').length;

    const patientsWithAdherence = activePatients.filter(p => p.adherenceScore != null);
    const avgAdherence = patientsWithAdherence.length > 0 
      ? Math.round(patientsWithAdherence.reduce((acc, p) => acc + (p.adherenceScore || 0), 0) / patientsWithAdherence.length)
      : 0;

    return {
      totalActive: activePatients.length,
      totalCompleted: completedPatients.length,
      emergencyCount: emergencyCases.length,
      avgAdherence,
      overdueCount,
      criticalPatient: emergencyCases[0] || null
    };
  }, [patients]);

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Search
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm);

      if (!matchesSearch) return false;

      // Filter
      if (selectedFilter === 'active') {
        return p.status === 'active';
      }
      if (selectedFilter === 'completed') {
        return p.status === 'completed';
      }
      if (selectedFilter === 'emergency') {
        return p.currentGlucose != null && (p.glucoseStatus === 'emergency_low' || p.currentGlucose < 3.9);
      }
      if (selectedFilter === 'meds_warning') {
        return p.adherenceScore != null && p.adherenceScore < 70;
      }
      if (selectedFilter === 'normal') {
        return p.glucoseStatus === 'normal';
      }
      if (selectedFilter === 'disconnected') {
        return p.deviceStatus === 'disconnected';
      }
      return true;
    });
  }, [patients, searchTerm, selectedFilter]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return (
    <div className={styles.clinicContainer}>
      {/* Top Navigation Bar */}
      <header className={styles.clinicNavbar}>
        <div className={styles.brandArea}>
          <div className={styles.brandLogo}>
            DIA<span>+</span> CLINIC PORTAL
          </div>
          <span className={styles.clinicBadge}>Mã PK: {clinicProfile?.id}</span>
          <div className={styles.clinicTitleGroup}>
            <h1>{clinicProfile?.name}</h1>
            <p>{clinicProfile?.department} • {clinicProfile?.address}</p>
          </div>
        </div>

        <div className={styles.navActionGroup}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginRight: '8px' }}>
            🕒 {currentTime.toLocaleTimeString('vi-VN')}
          </div>

          <button className={styles.qrBtn} onClick={() => setShowQRModal(true)}>
            <QrCode size={16} /> Mã QR Check-in
          </button>

          <button 
            className={styles.iconButton}
            onClick={() => setShowNotifDrawer(true)}
            title="Trung tâm thông báo"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className={styles.notifBadge}>{unreadNotifCount}</span>
            )}
          </button>

          <button 
            onClick={handleClearAll}
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecdd3',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title="Xóa sạch danh sách để quét thật"
          >
            🧹 Xóa để test quét
          </button>

          <button 
            onClick={handleLoadDemo}
            style={{
              background: '#f0f9ff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title="Nạp dữ liệu mẫu thuyết trình"
          >
            📊 Nạp dữ liệu mẫu
          </button>

          <div className={styles.doctorProfileChip}>
            <div className={styles.doctorAvatar}>👨‍⚕️</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{clinicProfile?.doctorName}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{clinicProfile?.doctorTitle}</div>
            </div>
          </div>

          <button 
            className={styles.iconButton} 
            onClick={() => navigate('/login')}
            title="Đăng xuất / Quay về trang chính"
          >
            <LogOut size={16} color="#ef4444" />
          </button>
        </div>
      </header>

      {/* Realtime Checkout Toast Notification */}
      {checkoutToast && (
        <div style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '12px 24px',
          margin: '12px 28px 0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          borderLeft: '4px solid #22c55e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', fontWeight: '700' }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{checkoutToast}</span>
          </div>
          <button 
            onClick={() => setCheckoutToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Flashing Red Emergency Banner */}
      {kpis.criticalPatient && (
        <div className={styles.emergencyTopBanner}>
          <div className={styles.emergencyBannerLeft}>
            <ShieldAlert size={26} />
            <div>
              <p className={styles.emergencyTitle}>
                🚨 CẢNH BÁO KHẨN CẤP: Bệnh nhân {kpis.criticalPatient.name} ({kpis.criticalPatient.code}) đang bị hạ đường huyết cấp {kpis.criticalPatient.currentGlucose} mmol/L!
              </p>
              <p className={styles.emergencySubtitle}>
                {kpis.criticalPatient.notes}
              </p>
            </div>
          </div>
          <button 
            className={styles.emergencyActionBtn}
            onClick={() => setSelectedPatient(kpis.criticalPatient)}
          >
            Xử trí ca cấp cứu ngay ➔
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className={styles.dashboardBody}>
        {/* 4 KPI Summary Cards */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div>
              <p className={styles.kpiTitle}>Đang điều trị tại PK</p>
              <h3 className={styles.kpiValue}>{kpis.totalActive}</h3>
              <p className={styles.kpiSub}>Bệnh nhân đã quét QR check-in</p>
            </div>
            <div className={styles.kpiIconWrapper} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Users size={22} />
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div>
              <p className={styles.kpiTitle} style={{ color: '#dc2626' }}>Cảnh báo khẩn cấp</p>
              <h3 className={styles.kpiValue} style={{ color: '#dc2626' }}>{kpis.emergencyCount}</h3>
              <p className={styles.kpiSub}>Hạ đường huyết &lt; 3.9 / SOS</p>
            </div>
            <div className={styles.kpiIconWrapper} style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={22} />
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div>
              <p className={styles.kpiTitle}>Tuân thủ phác đồ thuốc</p>
              <h3 className={styles.kpiValue} style={{ color: kpis.avgAdherence >= 80 ? '#16a34a' : '#ca8a04' }}>
                {kpis.avgAdherence}%
              </h3>
              <p className={styles.kpiSub}>Trung bình toàn phòng khám</p>
            </div>
            <div className={styles.kpiIconWrapper} style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div>
              <p className={styles.kpiTitle}>Quá hạn tái khám</p>
              <h3 className={styles.kpiValue} style={{ color: '#ea580c' }}>{kpis.overdueCount}</h3>
              <p className={styles.kpiSub}>Cần điều dưỡng gọi nhắc lịch</p>
            </div>
            <div className={styles.kpiIconWrapper} style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Clock size={22} />
            </div>
          </div>
        </section>

        {/* Patient Table Card */}
        <section className={styles.tableContainerCard}>
          {/* Table Toolbar */}
          <div className={styles.tableToolbar}>
            <div className={styles.filterTabs}>
              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'all' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                Tất cả ({patients.length})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'active' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('active')}
                style={{ color: selectedFilter === 'active' ? '#fff' : '#15803d' }}
              >
                🟢 Đang khám ({kpis.totalActive})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'completed' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('completed')}
                style={{ color: selectedFilter === 'completed' ? '#fff' : '#475569' }}
              >
                ✅ Đã kết thúc ({kpis.totalCompleted})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'emergency' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('emergency')}
                style={{ color: selectedFilter === 'emergency' ? '#fff' : '#dc2626' }}
              >
                🚨 Hạ đường huyết / Cấp cứu ({patients.filter(p => p.currentGlucose != null && p.currentGlucose < 3.9).length})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'meds_warning' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('meds_warning')}
              >
                💊 Quên thuốc / Kém tuân thủ ({patients.filter(p => p.adherenceScore != null && p.adherenceScore < 70).length})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'normal' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('normal')}
              >
                🟢 Ổn định ({patients.filter(p => p.glucoseStatus === 'normal').length})
              </button>

              <button 
                className={`${styles.filterTabBtn} ${selectedFilter === 'disconnected' ? styles.activeFilterTab : ''}`}
                onClick={() => setSelectedFilter('disconnected')}
              >
                ⚪ Mất kết nối máy đo ({patients.filter(p => p.deviceStatus === 'disconnected').length})
              </button>
            </div>

            <div className={styles.searchBox}>
              <Search size={16} color="#94a3b8" />
              <input 
                type="text"
                placeholder="Tìm tên, mã DIA, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={14} color="#94a3b8" />
                </button>
              )}
            </div>
          </div>

          {/* Table Data */}
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.patientTable}>
              <thead>
                <tr>
                  <th>Bệnh nhân</th>
                  <th>Phân loại ĐTĐ</th>
                  <th>Đường huyết mới nhất</th>
                  <th>Xu hướng</th>
                  <th>Điểm tuân thủ thuốc</th>
                  <th>Trạng thái khám</th>
                  <th>Trạng thái máy đo</th>
                  <th>Lịch tái khám</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff', color: '#0284c7', marginBottom: '14px' }}>
                        <QrCode size={32} />
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                        Chưa có bệnh nhân nào quét mã QR check-in
                      </h4>
                      <p style={{ margin: '0 auto 16px', fontSize: '13.5px', color: '#64748b', maxWidth: '440px', lineHeight: '1.5' }}>
                        Mời người bệnh mở camera trên App DIA+ (<strong>/scan</strong>) quét mã QR của phòng khám. Khi quét xong, thông tin bệnh nhân sẽ lập tức nhảy vào bảng theo dõi này.
                      </p>
                      <button
                        onClick={() => setShowQRModal(true)}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <QrCode size={16} /> Bật Mã QR Check-in Bàn Khám
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const isEmergency = patient.glucoseStatus === 'emergency_low' || patient.currentGlucose < 3.9;
                    return (
                      <tr 
                        key={patient.id} 
                        className={`${styles.patientRow} ${isEmergency ? styles.emergencyRow : ''}`}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <td>
                          <div className={styles.patientCell}>
                            <div className={styles.patientAvatarSmall}>
                              {patient.gender === 'Nữ' ? '👩' : '👨'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{patient.name}</strong>
                              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                                <span className={styles.patientCodeBadge}>{patient.code}</span> • {patient.age}t • {patient.phone}
                                {patient.prescriptionImage && (
                                  <span style={{ 
                                    background: '#eff6ff', 
                                    color: '#2563eb', 
                                    fontSize: '11px', 
                                    fontWeight: '700', 
                                    padding: '1px 6px', 
                                    borderRadius: '6px', 
                                    border: '1px solid #bfdbfe'
                                  }}>
                                    📸 Có ảnh đơn thuốc
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                            {patient.diabetesType}
                          </span>
                        </td>

                        <td>
                          {patient.currentGlucose == null ? (
                            <span style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                              ⚪ Chưa đo
                            </span>
                          ) : (patient.glucoseStatus === 'emergency_low' || patient.currentGlucose < 3.9) ? (
                            <span className={`${styles.badge} ${styles.badgeEmergency}`}>
                              🚨 {patient.currentGlucose} mmol/L
                            </span>
                          ) : (patient.glucoseStatus === 'high' || patient.currentGlucose > 10.0) ? (
                            <span className={`${styles.badge} ${styles.badgeHigh}`}>
                              🟠 {patient.currentGlucose} mmol/L
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeNormal}`}>
                              🟢 {patient.currentGlucose} mmol/L
                            </span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: '700' }}>
                            {patient.glucoseTrend === 'falling_fast' && (
                              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <TrendingDown size={16} /> Tụt dốc nhanh
                              </span>
                            )}
                            {patient.glucoseTrend === 'rising' && (
                              <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <TrendingUp size={16} /> Đang tăng
                              </span>
                            )}
                            {patient.glucoseTrend === 'stable' && (
                              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Minus size={16} /> Ổn định
                              </span>
                            )}
                            {(!patient.glucoseTrend || patient.glucoseTrend === 'unknown') && (
                              <span style={{ color: '#94a3b8' }}>Chưa rõ</span>
                            )}
                          </div>
                        </td>

                        <td>
                          {patient.adherenceScore == null ? (
                            <span style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Chưa có đơn thuốc
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '48px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${patient.adherenceScore}%`, 
                                  height: '100%', 
                                  background: patient.adherenceScore >= 85 ? '#16a34a' : patient.adherenceScore >= 70 ? '#eab308' : '#dc2626' 
                                }}></div>
                              </div>
                              <strong style={{ 
                                 fontSize: '13px', 
                                color: patient.adherenceScore >= 85 ? '#16a34a' : patient.adherenceScore >= 70 ? '#ca8a04' : '#dc2626' 
                              }}>
                                {patient.adherenceScore}%
                              </strong>
                            </div>
                          )}
                        </td>

                        <td>
                          {patient.status === 'completed' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: '1px solid #cbd5e1'
                            }}>
                              <CheckCircle2 size={13} color="#16a34a" /> Đã kết thúc ({patient.checkoutAt ? patient.checkoutAt.split(' ')[0] : 'Hoàn tất'})
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: '1px solid #bbf7d0'
                            }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Đang khám
                            </span>
                          )}
                        </td>

                        <td>
                          <span style={{ fontSize: '12.5px', color: '#475569' }}>
                            {patient.deviceStatus === 'cgm_connected' && '🟢 Dexcom CGM'}
                            {patient.deviceStatus === 'ble_synced' && '🔵 Máy đo Bluetooth'}
                            {patient.deviceStatus === 'disconnected' && '⚪ Mất kết nối'}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '12.5px', color: patient.status === 'overdue' ? '#dc2626' : '#64748b', fontWeight: patient.status === 'overdue' ? '700' : '500' }}>
                            {patient.nextAppointment}
                          </span>
                        </td>

                        <td>
                          <button 
                            className={styles.viewBtn}
                            onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}
                          >
                            Xem hồ sơ ➔
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdateNotes={handleUpdateNotes}
          onCheckout={handleCheckout}
        />
      )}

      {/* QR Code Check-in Modal */}
      {showQRModal && (
        <ClinicQRCodeModal
          clinicProfile={clinicProfile}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <>
          <div className={styles.notifDrawerOverlay} onClick={() => setShowNotifDrawer(false)} />
          <div className={styles.notifDrawer}>
            <div className={styles.notifDrawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                  Trung tâm Thông Báo ({notifications.length})
                </h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowNotifDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.notifList}>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''} ${n.severity === 'critical' ? styles.notifItemCritical : ''}`}
                  onClick={() => {
                    clinicService.markNotificationRead(n.id);
                    loadData();
                    if (n.patientId) {
                      const p = clinicService.getPatientById(n.patientId);
                      if (p) {
                        setSelectedPatient(p);
                        setShowNotifDrawer(false);
                      }
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: n.severity === 'critical' ? '#dc2626' : '#0284c7' }}>
                      {n.type === 'emergency' ? '🚨 CẤP CỨU' : n.type === 'medication' ? '💊 THUỐC' : n.type === 'workflow' ? '🏥 CHECK-IN' : '⏰ TÁI KHÁM'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    {n.title}
                  </strong>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                    {n.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
