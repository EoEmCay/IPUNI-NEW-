import { useState, useEffect, useRef } from 'react';
import styles from './ScanCamera.module.css';

export default function ScanCamera({ onImageScan }) {
  const [imageSource, setImageSource] = useState(null); // null = camera, 'file' = upload
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setImageSource('camera');
    } catch (err) {
      console.error('Camera access error:', err);
      // Fallback to file upload if camera not available
      setImageSource('file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      
      // Simulate processing delay
      setTimeout(() => {
        setIsUploading(false);
        onImageScan(file);
      }, 1000);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
      onImageScan(file);
    }, 'image/jpeg');
  };

  if (imageSource === null) {
    // Initial state - show options
    return (
      <div className={styles.container}>
        <div className={styles.options}>
          <button 
            onClick={startCamera} 
            className={styles.optionButton}
          >
            <span>📷</span>
            <span>Quét bằng camera</span>
          </button>
          <button 
            onClick={() => setImageSource('file')} 
            className={styles.optionButton}
          >
            <span>📁</span>
            <span>Chọn từ thư viện</span>
          </button>
        </div>
      </div>
    );
  }

  if (imageSource === 'camera') {
    return (
      <div className={styles.container}>
        <div className={styles.cameraView}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={styles.video}
          />
          <div className={styles.cameraOverlay}>
            <div className={styles.scanArea}>
              <div className={styles.scanBorder} />
              <div className={styles.scanInstructions}>
                Đặt to giấy đơn thuốc vào khung vuông
              </div>
            </div>
          </div>
          <div className={styles.cameraControls}>
            <button 
              onClick={handleCapture} 
              className={styles.captureButton}
            >
              📸 Chụp
            </button>
            <button 
              onClick={() => setImageSource(null)} 
              className={styles.cancelButton}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (imageSource === 'file') {
    return (
      <div className={styles.container}>
        <div className={styles.fileUpload}>
          <div className={styles.uploadIcon}>
            📁
          </div>
          <h3>Chọn ảnh đơn thuốc</h3>
          <p>Hoặc kéo thả ảnh vào đây</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {previewUrl && (
            <div className={styles.preview}>
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
          {isUploading && (
            <div className={styles.uploading}>
              Đang xử lý...
            </div>
          )}
          <button 
            onClick={() => setImageSource(null)} 
            className={styles.backButton}
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  return null;
}