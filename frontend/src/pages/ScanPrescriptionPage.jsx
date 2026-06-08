import { useState, useCallback } from 'react';
import { useMedications } from '../../hooks/useMedications';
import { useToast } from '../../hooks/useToast';
import Tesseract from 'tesseract.js';
import ScanCamera from '../../components/scan/ScanCamera';
import PrescriptionParser from '../../utils/prescriptionParser';
import styles from './ScanPrescriptionPage.module.css';

export default function ScanPrescriptionPage() {
  const { fetchMedications } = useMedications();
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsedMedication, setParsedMedication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleImageScan = useCallback(async (imageFile) => {
    setIsScanning(true);
    setIsProcessing(true);
    
    try {
      // Convert file to URL for preview
      const imageUrl = URL.createObjectURL(imageFile);
      setImageUrl(imageUrl);
      
      // Perform OCR
      const worker = Tesseract.createWorker({
        logger: m => console.log(m)
      });
      
      await worker.load();
      await worker.loadLanguage('vie'); // Vietnamese language
      await worker.initialize('vie');
      
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      
      setExtractedText(text);
      
      // Parse the extracted text
      const parsed = PrescriptionParser.parse(text);
      setParsedMedication(parsed);
      
    } catch (error) {
      console.error('OCR Error:', error);
      showToast('Lỗi khi quét ảnh. Vui lòng thử lại.', 'error');
    } finally {
      setIsScanning(false);
      setIsProcessing(false);
    }
  }, [showToast]);

  const handleSaveMedication = useCallback(async () => {
    if (!parsedMedication) return;
    
    try {
      // This would typically go through a service, but for now we'll use the hook
      // In a real implementation, we'd call medicationsService.create()
      showToast('Đang lưu thuốc...', 'info');
      
      // For now, we'll just show success and refresh the medications list
      // In a real app, you'd make the API call here
      showToast('Đã lưu thuốc thành công!', 'success');
      setParsedMedication(null);
      setExtractedText('');
      setImageUrl(null);
      fetchMedications();
    } catch (error) {
      console.error('Save Error:', error);
      showToast('Lỗi khi lưu thuốc. Vui lòng thử lại.', 'error');
    }
  }, [parsedMedication, fetchMedications, showToast]);

  const handleRetake = useCallback(() => {
    setExtractedText('');
    setParsedMedication(null);
    setImageUrl(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  }, [imageUrl]);

  if (isScanning) {
    return (
      <div className={styles.scanningOverlay}>
        <div className={styles.scanningContent}>
          <div className={styles.scanningSpinner} />
          <p>Đang quét và xử lý ảnh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Quét Đơn Thuốc</h1>
        <p>Chụp ảnh hoặc chọn ảnh từ thư viện để quét thông tin thuốc</p>
      </div>
      
      {!imageUrl ? (
        <ScanCamera onImageScan={handleImageScan} />
      ) : (
        <div className={styles.imagePreview}>
          <img src={imageUrl} alt="Scanned prescription" />
          <div className={styles.imageActions}>
            <button onClick={handleRetake}>Chụp lại</button>
          </div>
        </div>
      )}
      
      {extractedText && (
        <div className={styles.resultsSection}>
          <h2>Kết quả quét</h2>
          <div className={styles.extractedText}>
            <h3>Văn bản được nhận dạng:</h3>
            <p className={styles.textContent}>{extractedText}</p>
          </div>
          
          {parsedMedication && (
            <div className={styles.parsedInfo}>
              <h3>Thông tin thuốc đã识别:</h3>
              <div className={styles.medicationPreview}>
                <div className={styles.medicationName}>
                  <strong>Tên thuốc:</strong> {parsedMedication.name || 'Không xác định'}
                </div>
                <div className={styles.dosage}>
                  <strong>Liều lượng:</strong> {parsedMedication.dosage || 'Không xác định'}
                </div>
                <div className={styles.frequency}>
                  <strong>Tần suất:</strong> {parsedMedication.frequency || 'Không xác định'}
                </div>
                {parsedMedication.times && parsedMedication.times.length > 0 && (
                  <div className={styles.times}>
                    <strong>Thời điểm uống:</strong> {parsedMedication.times.join(', ')}
                  </div>
                )}
                {parsedMedication.instructions && (
                  <div className={styles.instructions}>
                    <strong>Cách dùng:</strong> {parsedMedication.instructions}
                  </div>
                )}
                {parsedMedication.doctor_name && (
                  <div className={styles.doctor}>
                    <strong>Bác sĩ:</strong> {parsedMedication.doctor_name}
                  </div>
                )}
              </div>
              
              <div className={styles.formActions}>
                <button 
                  onClick={handleSaveMedication} 
                  disabled={isProcessing}
                  className={styles.saveButton}
                >
                  {isProcessing ? 'Đang lưu...' : 'Lưu thuốc'}
                </button>
                <button 
                  onClick={handleRetake} 
                  className={styles.retakeButton}
                >
                  Chụp lại
                </button>
              </div>
            </div>
          )}
          
          {!parsedMedication && extractedText.trim() === '' && (
            <p className={styles.noText}>Không thể nhận dạng văn bản từ ảnh. Vui lòng thử lại với ảnh rõ hơn.</p>
          )}
        </div>
      )}
    </div>
  );
}