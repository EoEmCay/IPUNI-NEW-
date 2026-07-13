import { useRef, useEffect, useState } from 'react';
import { Camera, Upload, ImagePlus } from 'lucide-react';
import { useT } from '../../hooks/useT';
import styles from './ScanCamera.module.css';

export default function ScanCamera({ onImageScan }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const streamRef = useRef(null);
  const t = useT();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageScan(file);
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraFailed(true);
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext.2d;
    canvasRef.current.width = videoRef.current.videoWidth || 430;
    canvasRef.current.height = videoRef.current.videoHeight || 600;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      onImageScan(file);

      // Stop camera after capture
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        setCameraReady(false);
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Camera view - chỉ hiện khi camera sẵn sàng */}
      {cameraReady && (
        <div className={styles.cameraSection}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
          />
          <canvas
            ref={canvasRef}
            className={styles.canvas}
          />

          <div className={styles.controls}>
            <button onClick={handleCapture} className={styles.captureBtn}>
              <Camera size={24} />
              {t.scan.capture}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadBtnSmall}
            >
              <Upload size={20} />
              {t.scan.gallery}
            </button>
          </div>
        </div>
      )}

      {/* Fallback - hiện khi camera không khả dụng HOẶC chưa sẵn sàng */}
      {!cameraReady && (
        <div className={styles.fallback}>
          <div className={styles.fallbackContent}>
            <div className={styles.fallbackIcon}>
              <ImagePlus size={48} />
            </div>
            <h3>{t.scan.title}</h3>
            <p>{t.scan.cameraFallbackDesc}</p>
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className={styles.uploadBtn}
                style={{ flex: 1, padding: '12px 0', justifyContent: 'center' }}
              >
                <Camera size={20} />
                {t.scan.captureBtn}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
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
      )}

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
