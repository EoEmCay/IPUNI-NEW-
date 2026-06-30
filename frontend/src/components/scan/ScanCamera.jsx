import { useRef, useEffect, useState } from 'react';
import { Camera, Upload, ImagePlus } from 'lucide-react';
import styles from './ScanCamera.module.css';

export default function ScanCamera({ onImageScan }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const streamRef = useRef(null);

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
    const context = canvasRef.current.getContext('2d');
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
              Chụp
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadBtnSmall}
            >
              <Upload size={20} />
              Thư viện
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
            <h3>Quét Đơn Thuốc</h3>
            <p>Chọn ảnh đơn thuốc từ thư viện để AI tự động nhận diện</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadBtn}
            >
              <ImagePlus size={20} />
              Chọn ảnh
            </button>
            {cameraFailed && (
              <span className={styles.cameraNote}>
                Camera không khả dụng — hãy chọn ảnh từ thư viện
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
    </div>
  );
}
