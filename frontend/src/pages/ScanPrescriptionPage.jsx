import { useState, useCallback, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, User, Calendar, FileText,
  XCircle, ChevronDown, ChevronUp, Clock, Hash, Stethoscope, BookOpen, Info, Activity, Sparkles, X,
  Paperclip, ChevronLeft, ArrowRight
} from 'lucide-react';
import { scanService } from '../services/scan.service';
import { medicationsService } from '../services/medications.service';
import { appointmentsService } from '../services/appointments.service';
import { scanHistoryService } from '../services/scanHistory.service';
import { voiceAlertService } from '../services/voiceAlert.service';
import { metricsService } from '../services/metrics.service';
import { useMedications } from '../hooks/useMedications';
import { useToast } from '../hooks/useToast';
import { useT } from '../hooks/useT';
import { createPortal } from 'react-dom';
import ScanCamera from '../components/scan/ScanCamera';
import styles from './ScanPrescriptionPage.module.css';
import { useNavigate } from 'react-router-dom';

// Thông điệp tiến trình đổi theo giây trong lúc AI phân tích - tạo cảm giác thời gian
// trôi nhanh hơn thay vì 1 dòng chữ đứng yên suốt quá trình chờ.
const ANALYZE_STEPS = [
  { text: 'Đang tối ưu và xử lý độ nét của ảnh...' },
  { text: 'AI Gemini Vision đang đọc chữ viết & đơn thuốc...' },
  { text: 'Đang bóc tách tên thuốc, liều dùng & giờ uống...' },
  { text: 'Đang đồng bộ lời dặn bác sĩ & chỉ số xét nghiệm...' },
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

// Tự động tính toán lịch trình uống thuốc (số ngày, ngày bắt đầu, ngày kết thúc)
export const getMedScheduleDetails = (med, prescriptionDate) => {
  if (!med) return { duration: null, startDateStr: '', endDateStr: '', formattedStartDate: '', formattedEndDate: '', isAlternate: false };

  const startDateStr = prescriptionDate || new Date().toISOString().split('T')[0];
  let duration = med.durationDays || null;

  if (!duration) {
    const rawText = `${med.instructions || ''} ${med.frequency || ''}`;
    const dMatch = rawText.match(/(?:uống|dùng|trong)?\s*:?\s*(\d+)\s*(?:ngày|day)/i);
    if (dMatch && dMatch[1]) {
      duration = parseInt(dMatch[1], 10);
    }
  }

  let endDateStr = null;
  let formattedStartDate = '';
  let formattedEndDate = '';

  if (startDateStr) {
    const parts = startDateStr.split('-');
    if (parts.length === 3) {
      formattedStartDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (duration && duration > 0) {
        const sDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        sDate.setDate(sDate.getDate() + duration - 1);
        const y = sDate.getFullYear();
        const m = String(sDate.getMonth() + 1).padStart(2, '0');
        const d = String(sDate.getDate()).padStart(2, '0');
        endDateStr = `${y}-${m}-${d}`;
        formattedEndDate = `${d}/${m}/${y}`;
      }
    }
  }

  const isAlternate = Boolean(
    med.is_alternate_day || 
    /cách ngày|2 ngày 1 lần/i.test(med.frequency || med.instructions || '')
  );

  return {
    duration,
    startDateStr,
    endDateStr,
    formattedStartDate,
    formattedEndDate,
    isAlternate
  };
};

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const { fetchMedications } = useMedications();
  const { showToast } = useToast();
  const t = useT();
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeElapsed, setAnalyzeElapsed] = useState(0);
  const [tipOffset] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));
  const [result, setResult] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isAllSaved, setIsAllSaved] = useState(false);
  const [scanWizardStep, setScanWizardStep] = useState(1);
  const [selectedMedModalIndex, setSelectedMedModalIndex] = useState(null);
  const [showFullImagePreview, setShowFullImagePreview] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);

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
    setScanWizardStep(1);
    setSelectedMedModalIndex(null);
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

  const handleAnalyze = useCallback(async (targetFile) => {
    const fileToScan = targetFile || imageFile;
    if (!fileToScan) return;

    setAnalyzeElapsed(0);
    setIsAnalyzing(true);
    setScanWizardStep(1);
    setSelectedMedModalIndex(null);

    try {
      const res = await scanService.analyzePrescription(fileToScan);
      const data = res.data.data;
      setResult(data);
      setScanWizardStep(1);

      if (data.error) {
        showToast(data.error, 'error');
      } else if (!data.isPrescription && !data.isLabReport && (!data.medications || data.medications.length === 0)) {
        showToast(t.scanResult?.notPrescription || 'Ảnh không phải là một đơn thuốc. Vui lòng chụp lại đơn thuốc.', 'error');
      }

      // Tối ưu ảnh chụp thực tế của bệnh nhân sang bản base64 nét cao (~150-200KB)
      const photoBase64 = await compressPrescriptionPhoto(fileToScan);

      if (photoBase64 && data && !data.error) {
        try {
          await scanHistoryService.saveScan(data, photoBase64);
        } catch (e) {
          console.error('Failed to save scan history', e);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi kết nối đến server';
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, showToast, t]);

  const handleImageScan = useCallback((file) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setIsAllSaved(false);
    setExpandedIndex(null);
    setScanWizardStep(1);
    setSelectedMedModalIndex(null);
    // Tự động phân tích ngay lập tức
    handleAnalyze(file);
  }, [imageUrl, handleAnalyze]);

  const handleSaveAll = useCallback(async () => {
    if (!editableMeds || editableMeds.length === 0) return;
    if (requiresInsulinConfirm && !insulinConfirmed) return;

    setIsSavingAll(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const med of editableMeds) {
        try {
          const schedule = getMedScheduleDetails(med, result.prescriptionDate);
          const scheduleType = schedule.isAlternate ? 'every_n_days' : 'daily';
          const everyNDays = schedule.isAlternate ? 2 : null;

          await medicationsService.create({
            name: med.name,
            dosage: med.dosage || 'Theo chỉ định',
            frequency: med.frequency || 'Theo chỉ định bác sĩ',
            times: med.times && med.times.length > 0 ? med.times : ['07:00'],
            instructions: med.instructions || '',
            doctor_name: result.doctorName || med.doctor_name || '',
            prescribed_at: schedule.startDateStr,
            next_appointment_date: result.nextAppointmentDate || null,
            is_active: 1,
            schedule_type: scheduleType,
            every_n_days: everyNDays,
            anchor_date: schedule.startDateStr,
            end_date: schedule.endDateStr,
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

      // Tự động tắt popup sau khi lưu xong và quay về màn hình quét sẵn sàng
      setTimeout(() => {
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageFile(null);
        setImageUrl(null);
        setResult(null);
        setIsAllSaved(false);
        setScanWizardStep(1);
        setSelectedMedModalIndex(null);
      }, 700);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xử lý', 'error');
    } finally {
      setIsSavingAll(false);
    }
  }, [result, editableMeds, requiresInsulinConfirm, insulinConfirmed, fetchMedications, showToast, imageUrl]);

  const handleRetake = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setResult(null);
    setIsAllSaved(false);
    setExpandedIndex(null);
    setScanWizardStep(1);
    setSelectedMedModalIndex(null);
  }, [imageUrl]);

  const isAnyModalOpen = Boolean(
    (result && !result.error && (result.isDiabetesPrescription || result.isPrescription || (result.medications && result.medications.length > 0))) ||
    (showFullImagePreview && imageUrl) ||
    (selectedMedModalIndex !== null)
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAnyModalOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isAnyModalOpen]);

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
          <span className={styles.analyzingStepText}>{step.text}</span>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.tipBox} key={tip}>
          <Sparkles size={16} color="var(--color-primary)" className={styles.tipIcon} />
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
      </div>

      {!imageUrl ? (
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

          {result && !result.error && !result.isLabReport && (!result.isPrescription && !result.isDiabetesPrescription && (!result.medications || result.medications.length === 0)) && (
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

          {result && !result.error && (result.isDiabetesPrescription || result.isPrescription || (result.medications && result.medications.length > 0)) && typeof document !== 'undefined' && createPortal(
            <div className={styles.wizardOverlay}>
              <div className={styles.wizardModal}>
                <div className={styles.wizardHeader}>
                  <h3 className={styles.wizardTitle}>
                    {scanWizardStep === 1 ? (
                      <>
                        <FileText size={18} className={styles.wizardTitleIcon} />
                        Tổng quan đơn thuốc
                      </>
                    ) : (
                      <>
                        <Paperclip size={18} className={styles.wizardTitleIcon} />
                        {editableMeds.length} {t.scanResult?.medsCount || 'loại thuốc'}
                      </>
                    )}
                  </h3>
                  <button 
                    type="button" 
                    className={styles.wizardCloseBtn} 
                    onClick={handleRetake}
                    title="Đóng / Chụp lại"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.wizardBody}>
                  {scanWizardStep === 1 ? (
                    <div className={styles.wizardStep1}>
                      {/* 1. Thanh xem trước ảnh dạng ngang nhỏ gọn (~80px) kèm nút Phóng to & Chụp lại */}
                      <div className={styles.compactImageBar}>
                        <div 
                          className={styles.compactImageThumbWrap} 
                          onClick={() => setShowFullImagePreview(true)}
                          title="Chạm để xem ảnh phóng to"
                        >
                          <img src={imageUrl} alt="Đơn thuốc" className={styles.compactImageThumb} />
                          <span className={styles.compactImageZoomBadge}>Phóng to</span>
                        </div>
                        <div className={styles.compactImageMeta}>
                          <div className={styles.compactImageMetaTop}>
                            <span className={styles.compactImageTitle}>Đơn thuốc vừa quét</span>
                            <span className={styles.compactMedsCountBadge}>{editableMeds.length} loại thuốc</span>
                          </div>
                          <p className={styles.compactImageDate}>
                            Ngày kê: {result.prescriptionDate || new Date().toISOString().split('T')[0]}
                          </p>
                          <button 
                            type="button" 
                            className={styles.compactRetakeBtn}
                            onClick={handleRetake}
                          >
                            Chụp lại đơn khác
                          </button>
                        </div>
                      </div>

                      {/* 2. Khối chẩn đoán bệnh to rõ ràng, màu xanh chuẩn y tế */}
                      <div className={styles.compactDiagnosisCard}>
                        <div className={styles.compactDiagHeader}>
                          <CheckCircle size={18} className={styles.wizardCheckIcon} />
                          <span className={styles.compactDiagLabel}>CHẨN ĐOÁN CỦA BÁC SĨ</span>
                        </div>
                        <h4 className={styles.compactDiagTitle}>
                          {result.diagnosis || 'Đơn thuốc điều trị đái tháo đường ngoại trú'}
                        </h4>
                      </div>

                      {/* 3. Khối thông tin Bác sĩ & Lời dặn dồn gọn gàng */}
                      <div className={styles.compactDoctorCard}>
                        <div className={styles.compactDoctorRow}>
                          <span className={styles.compactDoctorChip}>
                            <User size={13} color="#0284c7" /> <strong>Bác sĩ:</strong> {result.doctorName || 'Bác sĩ điều trị'}
                          </span>
                          {result.nextAppointmentDate && (
                            <span className={styles.compactFollowupChip}>
                              <Calendar size={13} color="#b45309" /> <strong>Tái khám:</strong> {result.nextAppointmentDate}
                            </span>
                          )}
                        </div>

                        {result.doctorNotes && (
                          <div className={styles.compactDoctorNoteBox}>
                            <Stethoscope size={13} color="#1d4ed8" className={styles.compactNoteIcon} />
                            <p className={styles.compactDoctorNoteText}>
                              <strong>Lời dặn:</strong> {result.doctorNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.wizardStep2}>
                      <p className={styles.disclaimer} style={{ marginBottom: '12px' }}>
                        <AlertCircle size={13} /> Vui lòng kiểm tra tên thuốc, liều dùng và giờ uống trước khi lưu vào tủ thuốc.
                      </p>

                      <div className={styles.medListContainer}>
                        {editableMeds.map((med, i) => {
                          const times = med.times || [];
                          const hasSpecificTimes = Array.isArray(times) && times.length > 0;
                          const medSchedule = getMedScheduleDetails(med, result?.prescriptionDate);
                          const hasDosageWarning = Boolean(med.dosageWarning) && med.dosage === result?.medications?.[i]?.dosage;
                          return (
                            <div
                              key={i}
                              className={styles.medItem}
                              onClick={() => setSelectedMedModalIndex(i)}
                            >
                              <div className={styles.medSummary}>
                                <div className={styles.medSummaryLeft}>
                                  <h4 className={styles.medItemName}>
                                    {med.name}
                                    {med.isDiabetesDrug && <span className={styles.diaTag}>Hạ đường huyết</span>}
                                    {hasDosageWarning && (
                                      <span className={styles.dosageWarningTag} title={med.dosageWarning}>⚠️ Kiểm tra liều</span>
                                    )}
                                  </h4>
                                  <div className={styles.medItemMeta}>
                                    <span>Liều lượng: {med.dosage || 'Theo chỉ định'}</span>
                                    <span>Cách dùng: {med.instructions || med.frequency || (hasSpecificTimes ? `${times.length} lần/ngày` : 'Uống theo đơn')}</span>
                                    {medSchedule.duration ? (
                                      <span className={styles.medSchedulePill}>
                                        Lịch uống: {medSchedule.duration} ngày
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className={styles.medSummaryRight}>
                                  <div
                                    className={hasSpecificTimes ? styles.timeBadgeBox : styles.noTimeBadgeBox}
                                  >
                                    <Clock size={13} className={styles.timeClockIcon} />
                                    <span className={styles.timeValueText}>
                                      {hasSpecificTimes
                                        ? times.join(', ')
                                        : (med.timesPerDay ? `${med.timesPerDay} lần/ngày` : 'Chưa có giờ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {requiresInsulinConfirm && (
                        <div className={styles.insulinConfirmBox} style={{ marginTop: '14px' }}>
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

                      {showVoicePrompt && (
                        <div className={styles.voicePromptBanner}>
                          <div className={styles.voicePromptText}>
                            <Info size={18} />
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

                <div className={styles.wizardFooter}>
                  {scanWizardStep === 1 ? (
                    <button 
                      type="button" 
                      className={styles.wizardConfirmBtn}
                      onClick={() => setScanWizardStep(2)}
                    >
                      <CheckCircle size={20} /> Xác nhận đúng & Xem {editableMeds.length} loại thuốc <ArrowRight size={20} />
                    </button>
                  ) : (
                    <div className={styles.wizardFooterRow}>
                      <button 
                        type="button" 
                        className={styles.wizardBackBtn}
                        onClick={() => setScanWizardStep(1)}
                      >
                        <ChevronLeft size={16} /> Quay lại
                      </button>
                      <button
                        type="button"
                        className={isAllSaved ? styles.savedBtn : styles.wizardSaveBtn}
                        onClick={handleSaveAll}
                        disabled={isSavingAll || isAllSaved || (requiresInsulinConfirm && !insulinConfirmed)}
                      >
                        {isSavingAll ? t.scanResult?.savingAll : isAllSaved ? t.scanResult?.savedAll : (t.scanResult?.addAll || 'Lưu tất cả vào tủ thuốc')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal xem ảnh đơn thuốc phóng to khi chạm vào ảnh thu nhỏ */}
          {showFullImagePreview && imageUrl && typeof document !== 'undefined' && createPortal(
            <div className={styles.fullImageOverlay} onClick={() => setShowFullImagePreview(false)}>
              <div className={styles.fullImageModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.fullImageHeader}>
                  <span>Ảnh đơn thuốc gốc</span>
                  <button 
                    type="button" 
                    className={styles.wizardCloseBtn} 
                    onClick={() => setShowFullImagePreview(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.fullImageBody}>
                  <img src={imageUrl} alt="Đơn thuốc gốc" className={styles.fullImageImg} />
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal chi tiết cho người cao tuổi */}
          {selectedMedModalIndex !== null && editableMeds[selectedMedModalIndex] && typeof document !== 'undefined' && createPortal(
            <div className={styles.elderlyModalOverlay} onClick={() => setSelectedMedModalIndex(null)}>
              <div className={styles.elderlyModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.elderlyModalHeader}>
                  <div style={{ flex: 1 }}>
                    <h2 className={styles.elderlyModalTitle}>
                      {editableMeds[selectedMedModalIndex].name}
                    </h2>
                    {editableMeds[selectedMedModalIndex].isDiabetesDrug && (
                      <span className={styles.diaTag} style={{ display: 'inline-block', marginTop: '6px' }}>
                        Hạ đường huyết
                      </span>
                    )}
                  </div>
                  <button 
                    className={styles.elderlyCloseBtn} 
                    onClick={() => setSelectedMedModalIndex(null)}
                    title="Đóng"
                  >
                    <X size={22} />
                  </button>
                </div>

                {(() => {
                  const currentMed = editableMeds[selectedMedModalIndex];
                  // Cảnh báo lệch liều do backend tính sẵn dựa trên số AI đọc BAN ĐẦU - nếu
                  // người dùng đã tự sửa lại ô Liều lượng, cảnh báo cũ không còn đúng ngữ cảnh
                  // nữa nên ẩn đi (không hiển thị cảnh báo lỗi thời gây hiểu nhầm).
                  const originalDosage = result?.medications?.[selectedMedModalIndex]?.dosage;
                  const showDosageWarning = Boolean(currentMed.dosageWarning) && currentMed.dosage === originalDosage;
                  const schedule = getMedScheduleDetails(currentMed, result?.prescriptionDate);
                  const hasDoctorTime = (currentMed.hasDoctorTime !== undefined && currentMed.hasDoctorTime !== null)
                    ? Boolean(currentMed.hasDoctorTime)
                    : Boolean(
                        `${currentMed.instructions || ''} ${currentMed.frequency || ''} ${currentMed.dosage || ''}`.match(/sáng|trưa|chiều|tối|trước ăn|sau ăn|ngủ|buổi|\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b/i)
                      );

                  return (
                    <div className={styles.elderlyModalBody}>
                      {/* 1. Tóm tắt to rõ Liều & Cách dùng. Liều lượng CHO SỬA TRỰC TIẾP tại đây -
                          AI đọc chữ viết tay có thể nhầm số (vd "0,5mg" -> "5mg", sai lệch 10 lần,
                          đủ gây quá liều nguy hiểm). Đây chính là bước con người xác nhận cuối
                          cùng trước khi lưu, nên KHÔNG được khoá cứng thành text tĩnh. */}
                      <div className={styles.elderlySummaryCard}>
                        <div className={styles.elderlyRow}>
                          <span className={styles.elderlyLabel}>Liều lượng:</span>
                          <input
                            className={styles.elderlyInput}
                            type="text"
                            value={currentMed.dosage || ''}
                            placeholder="VD: 500mg"
                            onChange={(e) => handleMedFieldChange(selectedMedModalIndex, 'dosage', e.target.value)}
                          />
                        </div>
                        {showDosageWarning && (
                          <div className={styles.dosageWarningBanner}>
                            ⚠️ {currentMed.dosageWarning}
                          </div>
                        )}
                        <div className={styles.elderlyRow}>
                          <span className={styles.elderlyLabel}>Cách dùng:</span>
                          <span className={styles.elderlyValueText}>{currentMed.instructions || currentMed.frequency || 'Uống theo đơn'}</span>
                        </div>
                        {currentMed.quantity && (
                          <div className={styles.elderlyRow}>
                            <span className={styles.elderlyLabel}>Số lượng:</span>
                            <span className={styles.elderlyValueText}>{currentMed.quantity}</span>
                          </div>
                        )}
                        {schedule.duration ? (
                          <div className={styles.elderlyRow}>
                            <span className={styles.elderlyLabel}>Thời gian dùng:</span>
                            <span className={styles.elderlyValueHighlight}>
                              {schedule.duration} ngày {schedule.formattedStartDate && schedule.formattedEndDate ? `(Từ ${schedule.formattedStartDate} đến ${schedule.formattedEndDate})` : ''}
                            </span>
                          </div>
                        ) : null}
                        {hasDoctorTime && (
                          <div className={styles.elderlyRow}>
                            <span className={styles.elderlyLabel}>Giờ uống:</span>
                            <span className={styles.elderlyValueHighlight}>
                              {(currentMed.times && currentMed.times.length > 0) ? currentMed.times.join(', ') : '07:00'} (Theo đơn bác sĩ)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. Chọn cữ và giờ uống thuốc CHỈ ÁP DỤNG với những đơn thuốc không ghi giờ uống */}
                      {!hasDoctorTime && (
                        <div className={styles.elderlyTimeSection}>
                          <div className={styles.elderlySectionHeader}>
                            <span className={styles.elderlySectionTitle}>Chọn cữ giờ uống thuốc:</span>
                            <span className={styles.elderlySectionSubtitle}>Đơn thuốc chưa ghi rõ giờ, vui lòng chọn cữ phù hợp</span>
                          </div>

                          <div className={styles.elderlyTimeSlotsGrid}>
                            {[
                              { label: 'Sáng', time: '07:00' },
                              { label: 'Trưa', time: '11:30' },
                              { label: 'Chiều', time: '15:30' },
                              { label: 'Tối', time: '18:30' },
                              { label: 'Trước ngủ', time: '21:30' }
                            ].map((slot, idx) => {
                              const currentTimes = currentMed.times || [];
                              const isSelected = currentTimes.includes(slot.time);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`${styles.elderlySlotBtn} ${isSelected ? styles.elderlySlotBtnActive : ''}`}
                                  onClick={() => {
                                    let nextArr = [...currentTimes];
                                    if (isSelected) {
                                      nextArr = nextArr.filter(t => t !== slot.time);
                                    } else {
                                      nextArr.push(slot.time);
                                      nextArr.sort();
                                    }
                                    handleMedFieldChange(selectedMedModalIndex, 'times', nextArr);
                                  }}
                                >
                                  <span className={styles.elderlySlotLabel}>{slot.label}</span>
                                  <span className={styles.elderlySlotTime}>{slot.time}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className={styles.elderlyCustomTimeRow}>
                            <span className={styles.elderlyLabel}>Giờ cụ thể:</span>
                            <input
                              className={styles.elderlyInput}
                              type="text"
                              placeholder="VD: 07:00, 18:00"
                              value={(currentMed.times || []).join(', ')}
                              onChange={(e) => handleMedTimesChange(selectedMedModalIndex, e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lựa chọn uống cách ngày */}
                      <label className={styles.elderlyCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={Boolean(currentMed.is_alternate_day || schedule.isAlternate)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleMedFieldChange(selectedMedModalIndex, 'is_alternate_day', checked);
                            let freq = currentMed.frequency || '1 lần/ngày';
                            if (checked && !freq.includes('cách ngày')) {
                              freq = `${freq} (Cách ngày)`;
                            } else if (!checked) {
                              freq = freq.replace(' (Cách ngày)', '');
                            }
                            handleMedFieldChange(selectedMedModalIndex, 'frequency', freq);
                          }}
                        />
                        <span>Thuốc uống cách ngày (2 ngày uống 1 lần)</span>
                      </label>

                      {/* 3. Chi tiết công dụng / lưu ý lâm sàng */}
                      {currentMed.detail && (
                        <div className={styles.elderlyDetailSection}>
                          <h4 className={styles.elderlyDetailHeading}>Thông tin hướng dẫn y khoa:</h4>
                          {currentMed.detail.purpose && (
                            <div className={styles.elderlyDetailItem}>
                              <strong>Công dụng:</strong>
                              <p>{currentMed.detail.purpose}</p>
                            </div>
                          )}
                          {currentMed.detail.mechanism && (
                            <div className={styles.elderlyDetailItem}>
                              <strong>Cơ chế tác dụng:</strong>
                              <p>{currentMed.detail.mechanism}</p>
                            </div>
                          )}
                          {currentMed.detail.contraindications && (
                            <div className={styles.elderlyDetailItem} style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                              <strong style={{ color: '#DC2626' }}>Chống chỉ định / Lưu ý:</strong>
                              <p style={{ color: '#991B1B' }}>{currentMed.detail.contraindications}</p>
                            </div>
                          )}
                          {currentMed.detail.interactions && (
                            <div className={styles.elderlyDetailItem}>
                              <strong>Tương tác thuốc:</strong>
                              <p>{Array.isArray(currentMed.detail.interactions) ? currentMed.detail.interactions.join(', ') : currentMed.detail.interactions}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className={styles.elderlyModalFooter}>
                  <button
                    type="button"
                    className={styles.elderlyDoneBtn}
                    onClick={() => setSelectedMedModalIndex(null)}
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              </div>
            </div>,
            document.body
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
