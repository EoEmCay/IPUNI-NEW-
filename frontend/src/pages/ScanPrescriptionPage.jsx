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

// Hàm nén ảnh chụp gốc thành bản base64 siêu nét (1400px, JPEG 0.85, ~180KB)
// Đảm bảo đúng 100% ảnh bệnh nhân vừa chụp, không bị lỗi tràn bộ nhớ localStorage
const compressPrescriptionPhoto = (file) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxDimension = 1400; // Độ nét cao đủ để đọc từng nét chữ viết tay và con dấu
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            resolve(optimizedBase64);
          } catch {
            resolve(e.target.result);
          }
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
};

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
  const [prescriptionBase64, setPrescriptionBase64] = useState(null);

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

  const handlePerformCheckin = useCallback(async (qrData = {}) => {
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

    // Đính kèm ảnh đơn thuốc đã quét gần đây nhất nếu có
    let latestScanImage = null;
    let latestScanMeds = [];
    let latestScanHospital = '';
    let latestScanDoctor = '';
    let latestScanDate = '';
    let latestScanDiagnosis = '';

    try {
      const history = await scanHistoryService.getHistory();
      if (history && history.length > 0) {
        const latest = history[0];
        latestScanImage = latest.image || null;
        latestScanMeds = latest.result?.medications || [];
        latestScanHospital = latest.result?.hospitalName || '';
        latestScanDoctor = latest.result?.doctorName || '';
        latestScanDate = latest.result?.prescriptionDate || latest.date;
        latestScanDiagnosis = latest.result?.diagnosis || '';
      }
    } catch (e) {
      console.warn('Could not read scan history', e);
    }

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
      diabetesType: user?.diagnosis || 'Type 2',
      prescriptionImage: latestScanImage,
      prescriptionDate: latestScanDate,
      prescriptionHospital: latestScanHospital,
      prescriptionDoctor: latestScanDoctor,
      prescriptionDiagnosis: latestScanDiagnosis,
      medications: latestScanMeds.length > 0 ? latestScanMeds.map(m => ({
        name: m.name,
        dosage: m.dosage || '1 viên',
        timing: m.instructions || m.frequency || 'Theo chỉ định',
        status: 'pending'
      })) : []
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
  }, [user, userLatestMetrics, showToast]);

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
    setPrescriptionBase64(null);
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
      }

      // Tối ưu ảnh chụp thực tế của bệnh nhân sang bản base64 nét cao (~150-200KB)
      // Đảm bảo đúng 100% ảnh chụp gốc được chuyển tới Bác sĩ trên Clinic Dashboard
      const photoBase64 = await compressPrescriptionPhoto(imageFile);
      setPrescriptionBase64(photoBase64);

      if (photoBase64) {
        try {
          if (data && !data.error) {
            await scanHistoryService.saveScan(data, photoBase64);
          }

          const session = clinicService.getActivePatientClinicSession();
          await clinicService.syncPrescriptionToClinic({
            patientId: session?.patientId,
            patientCode: session?.patientCode || user?.user_code,
            userId: session?.userId || user?.id,
            phone: session?.phone || user?.phone || user?.email,
            name: session?.name || user?.name,
            prescriptionImage: photoBase64,
            prescriptionDate: data?.prescriptionDate || new Date().toISOString().split('T')[0],
            hospitalName: data?.hospitalName || '',
            doctorName: data?.doctorName || '',
            diagnosis: data?.diagnosis || user?.diagnosis || '',
            medications: data?.medications || []
          });
          showToast('📸 Đã truyền ảnh đơn thuốc trực tiếp đến Bác sĩ trên Clinic Dashboard!', 'success');
        } catch (e) {
          console.error('Failed to save or sync prescription', e);
        }
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

      // Đồng bộ danh sách thuốc đã xác nhận sang hồ sơ phòng khám
      try {
        const session = clinicService.getActivePatientClinicSession();
        clinicService.syncPrescriptionToClinic({
          patientId: session?.patientId,
          patientCode: session?.patientCode || user?.user_code,
          userId: session?.userId || user?.id,
          phone: session?.phone || user?.phone || user?.email,
          name: session?.name || user?.name,
          prescriptionImage: prescriptionBase64,
          prescriptionDate: result?.prescriptionDate || new Date().toISOString().split('T')[0],
          hospitalName: result?.hospitalName || '',
          doctorName: result?.doctorName || '',
          diagnosis: result?.diagnosis || user?.diagnosis || '',
          medications: editableMeds
        });
      } catch (syncErr) {
        console.warn('Sync confirmed meds error', syncErr);
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
  }, [result, editableMeds, requiresInsulinConfirm, insulinConfirmed, fetchMedications, showToast, user, prescriptionBase64]);

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

                            <div style={{ background: '#F1F5F9', padding: '10px 12px', borderRadius: 8, margin: '8px 0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>⏰ Chọn nhanh giờ uống:</span>
                                <span style={{ fontSize: 11, color: '#64748B' }}>Bấm để chọn/bỏ chọn cữ</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                {[
                                  { label: '🌅 Sáng', time: '07:00' },
                                  { label: '☀️ Trưa', time: '11:30' },
                                  { label: '🌆 Chiều', time: '15:30' },
                                  { label: '🌙 Tối', time: '18:30' },
                                  { label: '🛌 Trước ngủ', time: '21:30' }
                                ].map((p, idx) => {
                                  const currentTimes = med.times || [];
                                  const isSelected = currentTimes.includes(p.time);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        let nextArr = [...currentTimes];
                                        if (isSelected) {
                                          nextArr = nextArr.filter(t => t !== p.time);
                                        } else {
                                          nextArr.push(p.time);
                                          nextArr.sort();
                                        }
                                        handleMedFieldChange(i, 'times', nextArr);
                                      }}
                                      style={{
                                        fontSize: 11,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        border: isSelected ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                                        background: isSelected ? '#EFF6FF' : 'white',
                                        color: isSelected ? '#1D4ED8' : '#475569',
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {p.label} ({p.time})
                                    </button>
                                  );
                                })}
                              </div>

                              <div className={styles.editableRow} style={{ marginBottom: 6 }}>
                                <span className={styles.detailLabel}>{t.scanResult?.timeToTake}</span>
                                <input
                                  className={styles.editableInput}
                                  type="text"
                                  placeholder="07:00, 18:00"
                                  value={(med.times || []).join(', ')}
                                  onChange={(e) => handleMedTimesChange(i, e.target.value)}
                                />
                              </div>

                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(med.is_alternate_day || (med.frequency && med.frequency.includes('cách ngày')))}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleMedFieldChange(i, 'is_alternate_day', checked);
                                    let freq = med.frequency || '1 lần/ngày';
                                    if (checked && !freq.includes('cách ngày')) {
                                      freq = `${freq} (Cách ngày)`;
                                    } else if (!checked) {
                                      freq = freq.replace(' (Cách ngày)', '');
                                    }
                                    handleMedFieldChange(i, 'frequency', freq);
                                  }}
                                  style={{ width: 15, height: 15, accentColor: '#2563EB' }}
                                />
                                <span>📅 Thuốc uống cách ngày (2 ngày 1 lần)</span>
                              </label>
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
