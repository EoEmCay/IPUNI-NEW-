import { useRef, useState } from 'react';
import { Camera, Upload, ImagePlus } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { isNative } from '../../lib/native';
import styles from './ScanCamera.module.css';

/** Lấy ảnh qua camera/thư viện của iOS/Android (Capacitor). Trả về File dùng chung với luồng web. */
async function nativeGetPhoto(fromCamera) {
  const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const photo = await CapCamera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: fromCamera ? CameraSource.Camera : CameraSource.Photos,
  });
  const res = await fetch(photo.webPath);
  const blob = await res.blob();
  return new File([blob], `prescription.${photo.format || 'jpg'}`, { type: blob.type || 'image/jpeg' });
}

export default function ScanCamera({ onImageScan }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const t = useT();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageScan(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleNative = async (fromCamera) => {
    try {
      const file = await nativeGetPhoto(fromCamera);
      onImageScan(file);
    } catch (err) {
      if (!/cancel/i.test(err?.message || '')) setCameraFailed(true);
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
          {cameraFailed && (
            <span className={styles.cameraNote}>
              {t.scan.cameraError}
            </span>
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
