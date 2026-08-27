import { useState, useCallback, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, Pill, User, Calendar, FileText,
  XCircle, ChevronDown, ChevronUp, Clock, Hash, Stethoscope, BookOpen, Info, Activity, QrCode, Building, Sparkles
} from 'lucide-react';
import { clinicService } from './Clinic/clinicService';
import useAuthStore from '../store/authStore';
import { scanService } from '../services/scan.service';
import { medicationsService } from '../services/medications.service';
import { appointmentsService } from '../services/appointments.service';
import { scanHistoryService } from '../services/scanHistory.service';
import { voiceAlertService } from '../services/voiceAlert.service';
import { metricsService } from '../services/metrics.service';
import { useMedications } from '../hooks/useMedications';
import { useToast } from '../hooks/useToast';
import { useT } from '../hooks/useT';
import jsQR from 'jsqr';
import ScanCamera from '../components/scan/ScanCamera';
import LiveQRScanner from '../components/scan/LiveQRScanner';
import styles from './ScanPrescriptionPage.module.css';
import { useNavigate } from 'react-router-dom';

// Thông điệp tiến trình đổi theo giây trong lúc AI phân tích - tạo cảm giác thời gian
// trôi nhanh hơn thay vì 1 dòng chữ đứng yên suốt quá trình chờ.
const ANALYZE_STEPS = [
  { icon: '📸', text: 'Đang tối ưu và xử lý độ nét của ảnh...' },
  { icon: '🧠', text: 'AI Gemini Vision đang đọc chữ viết & đơn thuốc...' },
  { icon: '💊', text: 'Đang bóc tách tên thuốc, liều dùng & giờ uống...' },
  { icon: '🩺', text: 'Đang đồng bộ lời dặn bác sĩ & chỉ số xét nghiệm...' },
];

const HEALTH_TIPS = [
  'Nhớ đo đường huyết lúc đói trước khi ăn sáng nhé!',
  'Uống đủ nước giúp cơ thể chuyển hóa thuốc tốt hơn.',
  'Vận động nhẹ 15 phút sau bữa ăn giúp ổn định đường huyết.',
  'Luôn mang theo vài viên kẹo phòng khi hạ đường huyết đột ngột.',
  'Ngủ đủ giấc mỗi đêm giúp cơ thể kiểm soát insulin hiệu quả hơn.',
  'Ăn nhiều rau xanh giúp làm chậm hấp thu đường vào máu.',
];

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchMedications } = useMedications();
  const { showToast } = useToast();
  const t = useT();
  const [scanMode, setScanMode] = useState('prescription'); // 'prescription' | 'clinic_qr'
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeElapsed, setAnalyzeElapsed] = useState(0);
  const [tipOffset] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));
  const [result, setResult] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isAllSaved, setIsAllSaved] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);
  const [checkedInClinic, setCheckedInClinic] = useState(null);
  const [userLatestMetrics, setUserLatestMetrics] = useState(null);

  useEffect(() => {
    metricsService.getLatest().then((res) => {
      setUserLatestMetrics(res.data?.data || null);
    }).catch(() => {});
  }, [user]);

  // Check if patient is already checked in to a clinic, ensuring session belongs to current user account
  useEffect(() => {
    const session = clinicService.getActivePatientClinicSession();
    if (session) {
      if (user?.id && session.userId && String(session.userId) !== String(user.id)) {
        clinicService.patientLeaveClinic();
        setCheckedInClinic(null);
      } else {
        setCheckedInClinic(session);
      }
    } else {
      setCheckedInClinic(null);
    }
  }, [user]);

  const handlePerformCheckin = useCallback((qrData = {}) => {
    const profile = clinicService.getClinicProfile();
    const targetClinicName = qrData?.clinicName || profile.name;
    const targetDoctorName = qrData?.doctorName || profile.doctorName;

    // Use current logged-in user's profile to distinguish accounts
    const effectiveUserId = user?.id || (user?.email ? user.email : `anon-${Date.now()}`);
    const effectiveName = user?.name || (user?.email ? user.email.split('@')[0] : `Bệnh nhân DIA+`);
    const effectivePhone = user?.phone || (user?.email ? user.email : `09${Math.floor(10000000 + Math.random() * 90000000)}`);
    const effectiveCode = user?.user_code || `DIA-${Math.floor(1000 + Math.random() * 9000)}`;

    const effectiveGlucose = userLatestMetrics?.glucose_fasting?.value || userLatestMetrics?.glucose_postmeal?.value || null;
    const effectiveHba1c = userLatestMetrics?.hba1c?.value || null;

    const newPatient = clinicService.checkinFromPatientApp({
      userId: effectiveUserId,
      userCode: effectiveCode,
      name: effectiveName,
      gender: user?.gender || 'Nam',
      age: user?.age || 50,
      phone: effectivePhone,
      email: user?.email || '',
      glucose: effectiveGlucose,
      hba1c: effectiveHba1c,
      diabetesType: user?.diagnosis || 'Type 2'
    });

    setCheckedInClinic({
      clinicName: targetClinicName,
      doctorName: targetDoctorName,
      patientCode: newPatient.code,
      patientId: newPatient.id,
      userId: effectiveUserId,
      phone: effectivePhone,
      name: effectiveName
    });

    showToast(`🏥 Check-in thành công tại ${targetClinicName}! Bác sĩ đã nhận được hồ sơ của ${effectiveName}.`, 'success');
  }, [user, showToast]);

  const handleClinicQRCheckin = () => {
    handlePerformCheckin();
  };

  // Thuốc do AI trích xuất KHÔNG được lưu thẳng vào danh sách thuốc đang dùng - người
  // dùng phải xem/sửa được từng trường (tên, liều, giờ uống) trước khi bấm lưu, vì AI
  // vision có thể đọc nhầm chữ viết tay mờ (vd "5mg" -> "50mg"). editableMeds là bản sao
  // có thể chỉnh sửa của result.medications; handleSaveAll lưu từ đây, không phải result.
  const [editableMeds, setEditableMeds] = useState([]);
  const [insulinConfirmed, setInsulinConfirmed] = useState(false);
  // Điều chỉnh state phái sinh NGAY TRONG lúc render (thay vì useEffect) khi `result` đổi
  // sang tham chiếu mới - đây là pattern React khuyến nghị cho "reset state khi 1 giá trị
  // upstream đổi" (https://react.dev/learn/you-might-not-need-an-effect), tránh 1 lượt
  // render thừa so với dùng useEffect (vốn luôn chạy SAU khi commit, tạo cascading render).
  const [prevResult, setPrevResult] = useState(result);
  if (result !== prevResult) {
    setPrevResult(result);
    setEditableMeds(result?.medications?.length ? result.medications.map((m) => ({ ...m })) : []);
    setInsulinConfirmed(false);
  }

  // Đếm giây trong lúc AI đang phân tích - dùng để đổi thông điệp tiến trình, tăng dần
  // progress bar và xoay vòng mẹo sức khỏe. Reset về 0 mỗi khi bắt đầu 1 lượt phân tích
  // mới (isAnalyzing chuyển false -> true).
  useEffect(() => {
    if (!isAnalyzing) return undefined;
    const interval = setInterval(() => {
      setAnalyzeElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Insulin sai liều gây hạ đường huyết nặng nhanh hơn bất kỳ nhóm thuốc tiểu đường nào
  // khác - bắt buộc xác nhận thủ công riêng, không chỉ dựa vào việc xem qua danh sách.
  const INSULIN_PATTERN = /insulin|lantus|novomix|novorapid|humulin|humalog|levemir|mixtard|toujeo|tresiba|apidra/i;
  const requiresInsulinConfirm = editableMeds.some((m) => INSULIN_PATTERN.test(m.name || ''));

  const handleMedFieldChange = useCallback((index, field, value) => {
    setEditableMeds((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }, []);

  const handleMedTimesChange = useCallback((index, value) => {
    const times = value.split(',').map((t) => t.trim()).filter(Boolean);
    setEditableMeds((prev) => prev.map((m, i) => (i === index ? { ...m, times } : m)));
  }, []);

  const handleImageScan = useCallback((file) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setIsAllSaved(false);
    setExpandedIndex(null);
  }, [imageUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;

    setAnalyzeElapsed(0);
    setIsAnalyzing(true);

    // 1. Tự động kiểm tra nhanh xem ảnh chụp có phải là Mã QR Phòng Khám không (0.01 giây)
    try {
      const qrData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code && code.data) {
                let parsed = null;
                if (code.data.startsWith('{')) {
                  parsed = JSON.parse(code.data);
                } else if (code.data.includes('PK-') || code.data.includes('clinicId')) {
                  parsed = { type: 'DIAPLUS_CLINIC_CHECKIN', raw: code.data };
                }
                resolve(parsed);
                return;
              }
            } catch {}
            resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(imageFile);
      });

      if (qrData) {
        setIsAnalyzing(false);
        setScanMode('clinic_qr');
        handlePerformCheckin(qrData);
        return;
      }
    } catch (qrErr) {
      console.warn('QR pre-scan skipped', qrErr);
    }

    // 2. Nếu là đơn thuốc y tế bình thường thì gửi sang AI Gemini Vision
    try {
      const res = await scanService.analyzePrescription(imageFile);
      const data = res.data.data;
      setResult(data);

      if (data.error) {
        showToast(data.error, 'error');
      } else if (!data.isPrescription && !data.isLabReport) {
        showToast(t.scanResult?.notPrescription || 'Ảnh không phải là một đơn thuốc. Vui lòng chụp lại đơn thuốc.', 'error');
      } else if (data.isPrescription && !data.isDiabetesPrescription) {
        showToast(t.scanResult?.notDiabetes || 'Đây không phải đơn thuốc điều trị đái tháo đường. DIA+ chỉ hỗ trợ đơn thuốc tiểu đường.', 'error');
      } else {
        // Save to history on success or lab report
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          try {
            await scanHistoryService.saveScan(data, reader.result);
          } catch (e) {
            console.error('Failed to save to history', e);
          }
        };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi kết nối đến server';
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, showToast, t, user]);

  const handleSaveAll = useCallback(async () => {
    if (!editableMeds || editableMeds.length === 0) return;
    if (requiresInsulinConfirm && !insulinConfirmed) return;

    setIsSavingAll(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const med of editableMeds) {
        try {
          await medicationsService.create({
            name: med.name,
            dosage: med.dosage || 'Theo chỉ định',
            frequency: med.frequency || 'Theo chỉ định bác sĩ',
            times: med.times && med.times.length > 0 ? med.times : ['07:00'],
            instructions: med.instructions || '',
            doctor_name: result.doctorName || med.doctor_name || '',
            prescribed_at: result.prescriptionDate || new Date().toISOString().split('T')[0],
            next_appointment_date: result.nextAppointmentDate || null,
            is_active: 1,
          });
          successCount++;
        } catch (e) {
          console.error('Lưu thuốc thất bại:', med.name, e);
          failCount++;
        }
      }
      
      // Save doctor notes and visit info as a completed appointment if present
      if (result.doctorNotes || result.doctorName) {
        try {
          await appointmentsService.create({
            doctor_name: result.doctorName || (t.scanResult?.doctorDefault || 'Không rõ bác sĩ'),
            scheduled_at: result.prescriptionDate || new Date().toISOString().split('T')[0],
            note: result.doctorNotes || (t.scanResult?.noteDefault || 'Không có chỉ dẫn thêm'),
            status: 'completed'
          });
        } catch (e) {
          console.error('Lỗi khi lưu ghi chú bác sĩ', e);
        }
      }

      // Automatically schedule next appointment if found in prescription
      if (result.nextAppointmentDate) {
        try {
          await appointmentsService.create({
            doctor_name: result.doctorName || (t.scanResult?.doctorFollowup || 'Bác sĩ (Tái khám)'),
            scheduled_at: result.nextAppointmentDate,
            note: (t.scanResult?.noteFollowup || 'Lịch tái khám theo đơn thuốc'),
            status: 'upcoming'
          });
        } catch (e) {
          console.error('Lỗi khi lên lịch tái khám', e);
        }
      }
      // Save metrics if present
      if (result.metrics && result.metrics.length > 0) {
        for (const metric of result.metrics) {
          try {
            await metricsService.create({
              measurement_type: metric.measurement_type,
              value: metric.value,
              value_diastolic: metric.value_diastolic,
              measured_at: result.prescriptionDate ? new Date(result.prescriptionDate).toISOString() : new Date().toISOString(),
              note: 'Trích xuất tự động từ đơn thuốc'
            });
          } catch (e) {
            console.error('Lỗi khi lưu chỉ số', e);
          }
        }
      }

      setIsAllSaved(true);
      if (failCount === 0) {
        showToast(`${t.scanResult?.addSuccess} ${successCount} ${t.scanResult?.medsCount}!`, 'success');
      } else {
        showToast(`${t.scanResult?.addPartial} ${successCount}, thất bại ${failCount}.`, 'error');
      }
      fetchMedications();

      // Check if user has voice alerts configured
      const hasVoice = await voiceAlertService.hasAnyCustomVoice();
      if (!hasVoice) {
        setShowVoicePrompt(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xử lý', 'error');
    } finally {
      setIsSavingAll(false);
    }
  }, [result, editableMeds, requiresInsulinConfirm, insulinConfirmed, fetchMedications, showToast]);

  const handleRetake = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setResult(null);
    setIsAllSaved(false);
    setExpandedIndex(null);

  }, [imageUrl]);



  if (isAnalyzing) {
    // Giữ nguyên TopBar/BottomNav (không dùng SplashScreen toàn màn hình) - người dùng
    // đang thao tác trong app, không phải đang mở/đăng nhập lại app.
    const stepIndex = analyzeElapsed < 2 ? 0 : analyzeElapsed < 4 ? 1 : analyzeElapsed < 6 ? 2 : 3;
    const step = ANALYZE_STEPS[stepIndex];
    const progress = Math.min(95, 15 + analyzeElapsed * 9);
    const tip = HEALTH_TIPS[(tipOffset + Math.floor(analyzeElapsed / 5)) % HEALTH_TIPS.length];

    return (
      <div className={styles.analyzingBlock}>
        <div className={styles.analyzingRadar}>
          <div className={styles.radarRing} />
          <div className={`${styles.radarRing} ${styles.radarRingDelay}`} />
          <div className={styles.analyzingSpinner}>
            <Activity size={28} />
          </div>
        </div>

        <p className={styles.analyzingTitle}>AI Vision đang phân tích đơn thuốc</p>

        <div className={styles.analyzingStepRow} key={stepIndex}>
          <span className={styles.analyzingStepIcon}>{step.icon}</span>
          <span className={styles.analyzingStepText}>{step.text}</span>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.tipBox} key={tip}>
          <span className={styles.tipIcon}>💡</span>
          <span className={styles.tipText}>{tip}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.header} tour-step-5`}>
        <div className={styles.headerTop}>
          <h1>{t.scan.title}</h1>
          <button 
            className={styles.historyBtn} 
            onClick={() => navigate('/scan-history')}
            title={t.scan.historyTitle}
          >
            {t.scan.history}
          </button>
        </div>
        <p>{t.scan.subtitle}</p>

        {/* Chuyển đổi giữa Quét Đơn Thuốc & Quét QR Phòng Khám */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setScanMode('prescription')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: scanMode === 'prescription' ? '#ffffff' : 'transparent',
              color: scanMode === 'prescription' ? 'var(--color-primary, #0284c7)' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: scanMode === 'prescription' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Pill size={15} /> Quét Đơn Thuốc
          </button>

          <button
            onClick={() => setScanMode('clinic_qr')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: scanMode === 'clinic_qr' ? '#ffffff' : 'transparent',
              color: scanMode === 'clinic_qr' ? 'var(--color-primary, #0284c7)' : '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: scanMode === 'clinic_qr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <QrCode size={15} /> QR Phòng Khám
          </button>
        </div>
      </div>

      {scanMode === 'clinic_qr' ? (
        <div style={{ padding: '16px 0' }}>
          {checkedInClinic ? (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ width: '48px', height: '48px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#15803d' }}>
                Đang Điều Trị Tại Phòng Khám
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#166534' }}>
                {checkedInClinic.clinicName} • Bác sĩ: <strong>{checkedInClinic.doctorName}</strong>
              </p>
              <div style={{ fontSize: '12.5px', color: '#64748b', background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                Mã bệnh nhân của bạn: <strong>{checkedInClinic.patientCode}</strong>. Mọi chỉ số đo đường huyết của bạn đang được truyền trực tiếp đến Bác sĩ trên Clinic Dashboard.
              </div>
              <button
                onClick={async () => {
                  try {
                    await clinicService.patientLeaveClinic();
                  } catch (e) {
                    console.warn('Leave clinic warning', e);
                  }
                  setCheckedInClinic(null);
                  showToast('Đã kết thúc đợt khám tại phòng khám.', 'info');
                }}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kết Thúc Khám & Rời Phòng Khám
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <LiveQRScanner
                onScanSuccess={(qrData) => {
                  handlePerformCheckin(qrData);
                }}
              />

              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b' }}>
                  Hoặc bạn có thể bấm thử nghiệm kết nối nhanh:
                </p>
                <button
                  onClick={handleClinicQRCheckin}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Building size={15} /> Thử Check-in Vào Phòng Khám Hoàn Mỹ
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !imageUrl ? (
        <ScanCamera onImageScan={handleImageScan} />
      ) : (
        <>
          <div className={styles.imagePreview}>
            <img src={imageUrl} alt="Đơn thuốc" />
            <div className={styles.imageActions}>
              {!result && (
                <button onClick={handleAnalyze} className={styles.analyzeBtn}>
                  {t.scan.analyzeBtn}
                </button>
              )}
              <button onClick={handleRetake} className={styles.retakeBtn}>
                {t.scan.retakeBtn}
              </button>
            </div>
          </div>

          {result && !result.isDiabetesPrescription && !result.isLabReport && !result.error && (
            <div className={styles.results}>
              <div className={styles.rejectBanner}>
                <div className={styles.rejectIcon}>
                  <XCircle size={40} />
                </div>
                <strong>{t.scanResult?.notAccepted}</strong>
                <p>
                  {result.rejectionReason ||
                    (result.isPrescription
                      ? t.scanResult?.notDiabetes
                      : t.scanResult?.notPrescription)}
                </p>
              </div>
              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                {t.scan.scanAnotherBtn}
              </button>
            </div>
          )}

          {result && result.isLabReport && !result.error && (
            <div className={styles.results}>
              <div className={styles.rejectBanner} style={{ backgroundColor: 'rgba(27, 95, 166, 0.05)', borderColor: 'var(--color-primary)' }}>
                <div className={styles.rejectIcon} style={{ color: 'var(--color-primary)', background: 'white' }}>
                  <Activity size={40} />
                </div>
                <strong style={{ color: 'var(--color-primary)' }}>Hình ảnh bạn cung cấp là phiếu xét nghiệm</strong>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {result.labReportAdvice || 'Đây là phiếu xét nghiệm, không phải đơn thuốc.'}
                </p>
              </div>
              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                {t.scan.scanAnotherBtn}
              </button>
            </div>
          )}

          {result && result.isDiabetesPrescription && (
            <div className={styles.results}>
              <div className={styles.diabetesBanner}>
                <CheckCircle size={20} />
                <div>
                  <strong>{t.scanResult?.diabetesPrescription}</strong>
                  <p>{result.diagnosis || `${result.medications.length} ${t.scanResult?.medsRecognized}`}</p>
                </div>
              </div>

              <div className={styles.prescriptionGroup}>
                <div className={styles.prescriptionHeader}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaChip}>
                      <User size={13} /> {t.scanResult?.doctor}: {result.doctorName || 'Chưa nhận diện'}
                    </span>
                    <span className={styles.metaChip}>
                      <Calendar size={13} /> {t.scanResult?.prescribed}: {result.prescriptionDate || 'Chưa nhận diện'}
                    </span>
                    {result.nextAppointmentDate && (
                      <span className={styles.metaChip} style={{ background: '#FEF3C7', color: '#B45309' }}>
                        <Stethoscope size={13} /> {t.scanResult?.followup}: {result.nextAppointmentDate}
                      </span>
                    )}
                  </div>

                  {result.metrics && result.metrics.length > 0 && (
                    <div className={styles.metaRow}>
                      {result.metrics.map((m, i) => (
                        <span key={i} className={styles.metaChip} style={{ background: '#F0FDF4', color: '#16A34A' }}>
                          <Activity size={13} /> 
                          {m.measurement_type === 'blood_pressure' ? `${t.scanResult?.bloodPressure}: ${m.value}/${m.value_diastolic} mmHg` : 
                           m.measurement_type === 'glucose_fasting' ? `${t.scanResult?.glucoseFasting}: ${m.value} mmol/L` : 
                           `${m.measurement_type}: ${m.value}`}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.notesCard}>
                    <h3><Stethoscope size={15} /> {t.scanResult?.doctorNotes || 'Lời dặn Bác sĩ'}</h3>
                    <p>{result.doctorNotes || 'Không có lời dặn thêm'}</p>
                  </div>
                </div>

              {result.medications.length === 0 ? (
                <div className={styles.emptyResult}>
                  <FileText size={32} />
                  <p>{t.scanResult?.noMedsFound}</p>
                </div>
              ) : (
                <div className={styles.medicationsList}>
                  <h2>
                    <Pill size={16} />
                    {editableMeds.length} {t.scanResult?.medsCount}
                  </h2>
                  <p className={styles.disclaimer}>
                    <AlertCircle size={12} /> AI có thể đọc nhầm chữ viết tay mờ — vui lòng kiểm tra và sửa lại tên/liều/giờ uống trước khi lưu.
                  </p>
                  <div className={styles.medListContainer}>
                  {editableMeds.map((med, i) => {
                    const expanded = expandedIndex === i;
                    const detail = med.detail || {};
                    const hasDetail = detail.purpose || detail.mechanism || detail.contraindications || (detail.interactions && detail.interactions.length > 0);
                    return (
                      <div key={i} className={styles.medItem}>
                        <div className={styles.medSummary} onClick={() => setExpandedIndex(expanded ? null : i)}>
                          <div className={styles.medSummaryLeft}>
                            <span className={styles.medName}>
                              {med.name}
                              {med.isDiabetesDrug && <span className={styles.diaTag}>{t.scanResult?.diabetesTag}</span>}
                            </span>
                            <div className={styles.medStatsCompact}>
                              {med.dosage && <span>{med.dosage}</span>}
                              {med.times && med.times.length > 0 && (
                                <>
                                  <span className={styles.dotSeparator}>•</span>
                                  <span>{med.times.join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className={styles.medSummaryRight}>
                            {med.verified === false && (
                              <span className={styles.unverifiedBadgeIcon} title="Tên thuốc chưa khớp với cơ sở dữ liệu nội bộ — kiểm tra kỹ trước khi lưu">
                                <AlertCircle size={14} color="#F59E0B" />
                              </span>
                            )}
                            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>

                        {expanded && (
                          <div className={styles.medExpandedContent}>
                            <div className={styles.editableRow}>
                              <span className={styles.detailLabel}>Tên thuốc</span>
                              <input
                                className={styles.editableInput}
                                type="text"
                                value={med.name || ''}
                                onChange={(e) => handleMedFieldChange(i, 'name', e.target.value)}
                              />
                            </div>
                            <div className={styles.editableRow}>
                              <span className={styles.detailLabel}>Liều lượng</span>
                              <input
                                className={styles.editableInput}
                                type="text"
                                value={med.dosage || ''}
                                onChange={(e) => handleMedFieldChange(i, 'dosage', e.target.value)}
                              />
                            </div>

                            <div className={styles.medStats}>
                              {med.quantity && (
                                <span className={styles.statChip}><Hash size={12} /> {med.quantity}</span>
                              )}
                              {med.timesPerDay != null && (
                                <span className={styles.statChip}>
                                  <Clock size={12} /> {med.timesPerDay} {t.scanResult?.timesPerDay}
                                </span>
                              )}
                              {med.amountPerDose && (
                                <span className={styles.statChip}><Pill size={12} /> {med.amountPerDose}{t.scanResult?.perDose}</span>
                              )}
                            </div>

                            <div className={styles.editableRow}>
                              <span className={styles.detailLabel}>{t.scanResult?.timeToTake}</span>
                              <input
                                className={styles.editableInput}
                                type="text"
                                placeholder="07:00, 19:00"
                                value={(med.times || []).join(', ')}
                                onChange={(e) => handleMedTimesChange(i, e.target.value)}
                              />
                            </div>
                            <div className={styles.editableRow}>
                              <span className={styles.detailLabel}>{t.scanResult?.usage}</span>
                              <input
                                className={styles.editableInput}
                                type="text"
                                value={med.instructions || ''}
                                onChange={(e) => handleMedFieldChange(i, 'instructions', e.target.value)}
                              />
                            </div>

                            {hasDetail && (
                              <button
                                className={styles.detailToggle}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedIndex(expanded ? null : i);
                                }}
                              >
                                <span><Info size={14} /> {t.scanResult?.medDetail}</span>
                                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}
                            {expanded && hasDetail && (
                              <div className={styles.detailBox}>
                                {detail.purpose && (
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailItemLabel}>{t.scanResult?.purpose}</span>
                                    <p>{detail.purpose}</p>
                                  </div>
                                )}
                                {detail.mechanism && (
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailItemLabel}>{t.scanResult?.mechanism}</span>
                                    <p>{detail.mechanism}</p>
                                  </div>
                                )}
                                {detail.contraindications && (
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailItemLabel}>⚠️ {t.scanResult?.contraindications}</span>
                                    <p>{detail.contraindications}</p>
                                  </div>
                                )}
                                {detail.interactions && detail.interactions.length > 0 && (
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailItemLabel}>{t.scanResult?.interactions}</span>
                                    <p>{Array.isArray(detail.interactions) ? detail.interactions.join(', ') : detail.interactions}</p>
                                  </div>
                                )}
                                {detail.source && (
                                  <div className={styles.detailSource}>
                                    <BookOpen size={12} /> {t.scanResult?.source}: {detail.source === 'AI_GENERATED' ? 'Tổng hợp bởi AI, chưa qua kiểm chứng lâm sàng' : detail.source}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {requiresInsulinConfirm && (
                    <div className={styles.insulinConfirmBox}>
                      <label>
                        <input
                          type="checkbox"
                          checked={insulinConfirmed}
                          onChange={(e) => setInsulinConfirmed(e.target.checked)}
                        />
                        <span>
                          Đơn thuốc có <strong>insulin</strong> — tôi đã kiểm tra kỹ tên thuốc, liều lượng và giờ tiêm ở trên là chính xác trước khi lưu.
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    className={isAllSaved ? styles.savedBtn : styles.addBtn}
                    onClick={handleSaveAll}
                    disabled={isSavingAll || isAllSaved || (requiresInsulinConfirm && !insulinConfirmed)}
                  >
                    {isSavingAll ? t.scanResult?.savingAll : isAllSaved ? t.scanResult?.savedAll : t.scanResult?.addAll}
                  </button>

                  {showVoicePrompt && (
                    <div className={styles.voicePromptBanner}>
                      <div className={styles.voicePromptText}>
                        <span>🔔</span>
                        <p>{t.scanResult?.voicePrompt}</p>
                      </div>
                      <div className={styles.voicePromptActions}>
                        <button className={styles.voicePromptGo} onClick={() => navigate('/settings')}>
                          {t.scanResult?.install}
                        </button>
                        <button className={styles.voicePromptDismiss} onClick={() => setShowVoicePrompt(false)}>
                          {t.scanResult?.later}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>

              <p className={styles.disclaimer}>
                <AlertCircle size={12} /> {t.scanResult?.disclaimer}
              </p>

              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                {t.scan.scanAnotherBtn}
              </button>
            </div>
          )}

          {result && result.error && (
            <div className={styles.results}>
              <div className={styles.emptyResult}>
                <FileText size={32} />
                <p>{result.error}</p>
              </div>
              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                {t.scan.retakeBtn}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
