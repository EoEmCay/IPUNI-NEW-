import { useRef, useState } from 'react';
import { Camera, Upload, ImagePlus, AlertCircle } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { isNative, captureNativePhoto } from '../../lib/native';
import styles from './ScanCamera.module.css';

export default function ScanCamera({ onImageScan }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const t = useT();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      onImageScan(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleNative = async (fromCamera) => {
    setErrorMessage(null);
    try {
      const file = await captureNativePhoto({ fromCamera, quality: 80, maxWidth: 1600 });
      if (file) {
        onImageScan(file);
      }
    } catch (err) {
      if (/cancel/i.test(err?.message || '')) return; // Người dùng chủ động hủy/quay lại
      if (err?.code === 'PERMISSION_DENIED' || /permission/i.test(err?.message || '')) {
        setErrorMessage('Vui lòng cấp quyền Camera/Thư viện trong Cài đặt điện thoại để DIA+ quét đơn thuốc.');
      } else {
        setErrorMessage(t.scan?.cameraError || 'Không thể mở máy ảnh. Bạn có thể chọn ảnh từ thư viện.');
      }
    }
  };

  // Không tự động gọi navigator.mediaDevices.getUserMedia ngầm khi vào trang,
  // tránh bật chấm đỏ ghi hình (🔴) trên thanh tab trình duyệt / điện thoại gây hoang mang cho người dùng.
  const pickCamera = () => (isNative ? handleNative(true) : cameraInputRef.current?.click());
  const pickLibrary = () => (isNative ? handleNative(false) : fileInputRef.current?.click());

  return (
    <div className={styles.container}>
      <div className={styles.fallback}>
        <div className={styles.fallbackContent}>
          <div className={styles.fallbackIcon}>
            <ImagePlus size={48} />
          </div>
          <h3>{t.scan.title}</h3>
          <p>{t.scan.cameraFallbackDesc}</p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button
              onClick={pickCamera}
              className={styles.uploadBtn}
              style={{ flex: 1, padding: '12px 0', justifyContent: 'center' }}
            >
              <Camera size={20} />
              {t.scan.captureBtn}
            </button>
            <button
              onClick={pickLibrary}
              className={styles.uploadBtn}
              style={{ flex: 1, padding: '12px 0', justifyContent: 'center', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <Upload size={20} />
              {t.scan.gallery}
            </button>
          </div>
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              maxWidth: '320px',
              textAlign: 'left',
              marginTop: '8px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
