import { useState, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Pill, User, Calendar, FileText,
  XCircle, ChevronDown, ChevronUp, Clock, Hash, Stethoscope, BookOpen, Info, Activity
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
import useLangStore from '../store/langStore';
import ScanCamera from '../components/scan/ScanCamera';
import styles from './ScanPrescriptionPage.module.css';
import { useNavigate } from 'react-router-dom';

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const { fetchMedications } = useMedications();
  const { showToast } = useToast();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
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
  }, [imageFile, showToast]);

  const handleSaveAll = useCallback(async () => {
    if (!result || !result.medications || result.medications.length === 0) return;
    
    setIsSavingAll(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const med of result.medications) {
        try {
          await medicationsService.create({
            name: med.name,
            dosage: med.dosage || 'Theo chỉ định',
            frequency: med.frequency || 'Theo chỉ định bác sĩ',
            times: med.times && med.times.length > 0 ? med.times : ['07:00'],
            instructions: med.instructions || '',
            doctor_name: result.doctorName || med.doctor_name || '',
            prescribed_at: result.prescriptionDate || new Date().toISOString().split('T')[0],
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
          <p>{t.scan.analyzing}</p>
          <span className={styles.scanningHint}>{t.scan.analyzingHint}</span>
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
                <div className={styles.metaRow} style={{ marginTop: '8px' }}>
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

              {result.medications.length === 0 ? (
                <div className={styles.emptyResult}>
                  <FileText size={32} />
                  <p>{t.scanResult?.noMedsFound}</p>
                </div>
              ) : (
                <div className={styles.medicationsList}>
                  <h2>
                    <Pill size={16} />
                    {result.medications.length} {t.scanResult?.medsCount}
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
                            {med.isDiabetesDrug && <span className={styles.diaTag}>{t.scanResult?.diabetesTag}</span>}
                          </span>
                          {med.dosage && <span className={styles.medDosage}>{med.dosage}</span>}
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

                        {med.times && med.times.length > 0 && (
                          <div className={styles.medDetail}>
                            <span className={styles.detailLabel}>{t.scanResult?.timeToTake}</span>
                            <span>{med.times.join(', ')}</span>
                          </div>
                        )}
                        {med.instructions && (
                          <div className={styles.medDetail}>
                            <span className={styles.detailLabel}>{t.scanResult?.usage}</span>
                            <span>{med.instructions}</span>
                          </div>
                        )}

                        {hasDetail && (
                          <button
                            className={styles.detailToggle}
                            onClick={() => setExpandedIndex(expanded ? null : i)}
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
                                <BookOpen size={12} /> {t.scanResult?.source}: {detail.source}
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
                    disabled={isSavingAll || isAllSaved}
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
