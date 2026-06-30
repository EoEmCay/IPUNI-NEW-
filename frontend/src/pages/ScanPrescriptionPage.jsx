import { useState, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Pill, User, Calendar, FileText,
  XCircle, ChevronDown, ChevronUp, Clock, Hash, Stethoscope, BookOpen, Info,
} from 'lucide-react';
import { scanService } from '../services/scan.service';
import { medicationsService } from '../services/medications.service';
import { appointmentsService } from '../services/appointments.service';
import { scanHistoryService } from '../services/scanHistory.service';
import { voiceAlertService } from '../services/voiceAlert.service';
import { useMedications } from '../hooks/useMedications';
import { useToast } from '../hooks/useToast';
import ScanCamera from '../components/scan/ScanCamera';
import styles from './ScanPrescriptionPage.module.css';
import { useNavigate } from 'react-router-dom';

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const { fetchMedications } = useMedications();
  const { showToast } = useToast();
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isAllSaved, setIsAllSaved] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);


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

    setIsAnalyzing(true);
    try {
      const res = await scanService.analyzePrescription(imageFile);
      const data = res.data.data;
      setResult(data);

      if (data.error) {
        showToast(data.error, 'error');
      } else if (!data.isPrescription) {
        showToast('Không tiếp nhận đơn thuốc này. Ảnh không phải là một đơn thuốc. Vui lòng chụp lại đơn thuốc đái tháo đường.', 'error');
      } else if (!data.isDiabetesPrescription) {
        showToast('Không tiếp nhận đơn thuốc này. Đây không phải đơn thuốc điều trị đái tháo đường (tiểu đường). DIA+ chỉ hỗ trợ phân tích đơn thuốc tiểu đường.', 'error');
      } else {
        // Save to history on success
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
  }, [imageFile, showToast]);

  const handleSaveAll = useCallback(async () => {
    if (!result || !result.medications || result.medications.length === 0) return;
    
    setIsSavingAll(true);
    try {
      const promises = result.medications.map(med => 
        medicationsService.create({
          name: med.name,
          dosage: med.dosage || 'Theo chỉ định',
          frequency: med.frequency || 'Theo chỉ định bác sĩ',
          times: med.times && med.times.length > 0 ? med.times : ['07:00'],
          instructions: med.instructions || '',
          doctor_name: result.doctorName || med.doctor_name || '',
          prescribed_at: result.prescriptionDate || new Date().toISOString().split('T')[0],
          is_active: 1,
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;
      
      // Save doctor notes and visit info as a completed appointment if present
      if (result.doctorNotes || result.doctorName) {
        try {
          await appointmentsService.create({
            doctor_name: result.doctorName || 'Không rõ bác sĩ',
            scheduled_at: result.prescriptionDate || new Date().toISOString().split('T')[0],
            note: result.doctorNotes || 'Không có chỉ dẫn thêm',
            status: 'completed'
          });
        } catch (e) {
          console.error('Lỗi khi lưu ghi chú bác sĩ', e);
        }
      }

      setIsAllSaved(true);
      if (failCount === 0) {
        showToast(`Đã thêm thành công ${successCount} loại thuốc!`, 'success');
      } else {
        showToast(`Lưu ${successCount} thành công, ${failCount} thất bại.`, 'error');
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
  }, [result, fetchMedications, showToast]);

  const handleRetake = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setResult(null);
    setIsAllSaved(false);
    setExpandedIndex(null);

  }, [imageUrl]);



  if (isAnalyzing) {
    return (
      <div className={styles.scanningOverlay}>
        <div className={styles.scanningContent}>
          <div className={styles.scanningSpinner} />
          <p>Đang phân tích đơn thuốc...</p>
          <span className={styles.scanningHint}>Thường mất 5–15 giây</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Quét Đơn Thuốc</h1>
          <button 
            className={styles.historyBtn} 
            onClick={() => navigate('/scan-history')}
            title="Xem lịch sử quét"
          >
            Lịch sử
          </button>
        </div>
        <p>Chụp ảnh đơn thuốc để tự động nhận diện và lưu thuốc</p>
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
                  Phân Tích Đơn Thuốc
                </button>
              )}
              <button onClick={handleRetake} className={styles.retakeBtn}>
                Chụp lại
              </button>
            </div>
          </div>

          {result && !result.isDiabetesPrescription && !result.error && (
            <div className={styles.results}>
              <div className={styles.rejectBanner}>
                <div className={styles.rejectIcon}>
                  <XCircle size={40} />
                </div>
                <strong>Không tiếp nhận đơn thuốc này</strong>
                <p>
                  {result.rejectionReason ||
                    (result.isPrescription
                      ? 'Đây không phải đơn thuốc điều trị đái tháo đường (tiểu đường). DIA+ chỉ hỗ trợ phân tích đơn thuốc tiểu đường.'
                      : 'Ảnh không phải là một đơn thuốc. Vui lòng chụp lại đơn thuốc đái tháo đường.')}
                </p>
              </div>
              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                Quét đơn thuốc khác
              </button>
            </div>
          )}

          {result && result.isDiabetesPrescription && (
            <div className={styles.results}>
              <div className={styles.diabetesBanner}>
                <CheckCircle size={20} />
                <div>
                  <strong>Đơn thuốc điều trị đái tháo đường</strong>
                  <p>{result.diagnosis || `${result.medications.length} thuốc được nhận diện`}</p>
                </div>
              </div>

              {(result.doctorName || result.prescriptionDate) && (
                <div className={styles.metaRow}>
                  {result.doctorName && (
                    <span className={styles.metaChip}>
                      <User size={13} /> {result.doctorName}
                    </span>
                  )}
                  {result.prescriptionDate && (
                    <span className={styles.metaChip}>
                      <Calendar size={13} /> {result.prescriptionDate}
                    </span>
                  )}
                </div>
              )}

              {result.doctorNotes && (
                <div className={styles.notesCard}>
                  <h3><Stethoscope size={15} /> Lời dặn của bác sĩ</h3>
                  <p>{result.doctorNotes}</p>
                </div>
              )}

              {result.medications.length === 0 ? (
                <div className={styles.emptyResult}>
                  <FileText size={32} />
                  <p>Không tìm thấy thuốc trong ảnh. Vui lòng thử ảnh rõ hơn.</p>
                </div>
              ) : (
                <div className={styles.medicationsList}>
                  <h2>
                    <Pill size={16} />
                    {result.medications.length} loại thuốc
                  </h2>
                  {result.medications.map((med, i) => {
                    const expanded = expandedIndex === i;
                    const detail = med.detail || {};
                    const hasDetail = detail.purpose || detail.mechanism || detail.contraindications || (detail.interactions && detail.interactions.length > 0);
                    return (
                      <div key={i} className={styles.medCard}>
                        <div className={styles.medHeader}>
                          <span className={styles.medName}>
                            {med.name}
                            {med.isDiabetesDrug && <span className={styles.diaTag}>Hạ đường huyết</span>}
                          </span>
                          {med.dosage && <span className={styles.medDosage}>{med.dosage}</span>}
                        </div>

                        <div className={styles.medStats}>
                          {med.quantity && (
                            <span className={styles.statChip}><Hash size={12} /> {med.quantity}</span>
                          )}
                          {med.timesPerDay != null && (
                            <span className={styles.statChip}>
                              <Clock size={12} /> {med.timesPerDay} lần/ngày
                            </span>
                          )}
                          {med.amountPerDose && (
                            <span className={styles.statChip}><Pill size={12} /> {med.amountPerDose}/lần</span>
                          )}
                        </div>

                        {med.times && med.times.length > 0 && (
                          <div className={styles.medDetail}>
                            <span className={styles.detailLabel}>Thời điểm uống</span>
                            <span>{med.times.join(', ')}</span>
                          </div>
                        )}
                        {med.instructions && (
                          <div className={styles.medDetail}>
                            <span className={styles.detailLabel}>Cách dùng</span>
                            <span>{med.instructions}</span>
                          </div>
                        )}

                        {hasDetail && (
                          <button
                            className={styles.detailToggle}
                            onClick={() => setExpandedIndex(expanded ? null : i)}
                          >
                            <span><Info size={14} /> Chi tiết về thuốc</span>
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                        {expanded && hasDetail && (
                          <div className={styles.detailBox}>
                            {detail.purpose && (
                              <div className={styles.detailItem}>
                                <span className={styles.detailItemLabel}>Công dụng</span>
                                <p>{detail.purpose}</p>
                              </div>
                            )}
                            {detail.mechanism && (
                              <div className={styles.detailItem}>
                                <span className={styles.detailItemLabel}>Giải quyết vấn đề gì</span>
                                <p>{detail.mechanism}</p>
                              </div>
                            )}
                            {detail.contraindications && (
                              <div className={styles.detailItem}>
                                <span className={styles.detailItemLabel}>⚠️ Không dùng cho</span>
                                <p>{detail.contraindications}</p>
                              </div>
                            )}
                            {detail.interactions && detail.interactions.length > 0 && (
                              <div className={styles.detailItem}>
                                <span className={styles.detailItemLabel}>Tương tác thuốc</span>
                                <p>{Array.isArray(detail.interactions) ? detail.interactions.join(', ') : detail.interactions}</p>
                              </div>
                            )}
                            {detail.source && (
                              <div className={styles.detailSource}>
                                <BookOpen size={12} /> Nguồn: {detail.source}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                  
                  <button
                    className={isAllSaved ? styles.savedBtn : styles.addBtn}
                    onClick={handleSaveAll}
                    disabled={isAllSaved || isSavingAll}
                  >
                    {isSavingAll ? 'Đang lưu...' : isAllSaved ? (
                      <><CheckCircle size={15} /> Đã lưu toàn bộ vào sổ tay</>
                    ) : (
                      `Thêm tất cả ${result.medications.length} thuốc vào sổ tay`
                    )}
                  </button>

                  {showVoicePrompt && (
                    <div className={styles.voicePromptBanner}>
                      <div className={styles.voicePromptText}>
                        <span>🔔</span>
                        <p>Bạn chưa cài giọng nhắc uống thuốc. Thiết lập ngay để không bỏ lỡ thuốc!</p>
                      </div>
                      <div className={styles.voicePromptActions}>
                        <button className={styles.voicePromptGo} onClick={() => navigate('/settings')}>
                          Cài đặt
                        </button>
                        <button className={styles.voicePromptDismiss} onClick={() => setShowVoicePrompt(false)}>
                          Để sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className={styles.disclaimer}>
                <AlertCircle size={12} /> Thông tin do AI tổng hợp, chỉ mang tính tham khảo.
                Luôn tuân theo chỉ định của bác sĩ điều trị.
              </p>

              <button onClick={handleRetake} className={styles.scanAgainBtn}>
                Quét đơn thuốc khác
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
                Chụp lại
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
