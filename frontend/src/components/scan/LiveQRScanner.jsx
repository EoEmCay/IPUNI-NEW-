import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, Sparkles, X, QrCode } from 'lucide-react';

export default function LiveQRScanner({ onScanSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedData, setDetectedData] = useState(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Play beep sound on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio not permitted without interaction
    }
  };

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setHasCamera(false);
      setCameraError('Không thể mở Camera. Bạn có thể chọn ảnh mã QR từ thư viện ảnh.');
    }
  }, []);

  // QR Scanning Loop using jsQR
  useEffect(() => {
    let active = true;

    const scanFrame = () => {
      if (!active || !isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          try {
            let parsed = null;
            if (code.data.startsWith('{')) {
              parsed = JSON.parse(code.data);
            } else if (code.data.includes('clinicId=')) {
              const url = new URL(code.data, window.location.origin);
              const clinicId = url.searchParams.get('clinicId');
              parsed = { type: 'DIAPLUS_CLINIC_CHECKIN', clinicId };
            }

            if (parsed) {
              active = false;
              setIsScanning(false);
              playBeep();
              setDetectedData(parsed);
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
              }
              onScanSuccess(parsed);
              return;
            }
          } catch (e) {
            console.warn('Failed parsing QR', e);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    startCamera().then(() => {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    });

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isScanning, onScanSuccess, startCamera]);

  // Handle uploaded QR image file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          try {
            let parsed = null;
            if (code.data.startsWith('{')) {
              parsed = JSON.parse(code.data);
            } else {
              parsed = { type: 'DIAPLUS_CLINIC_CHECKIN', clinicId: 'PK-HOAN-MY-01', raw: code.data };
            }
            playBeep();
            setDetectedData(parsed);
            onScanSuccess(parsed);
          } catch {
            alert('Mã QR trong ảnh không hợp lệ.');
          }
        } else {
          alert('Không tìm thấy mã QR trong ảnh vừa chọn. Vui lòng thử ảnh khác.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'relative',
      background: '#0f172a',
      borderRadius: '20px',
      overflow: 'hidden',
      padding: '20px',
      color: '#ffffff',
      textAlign: 'center',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
    }}>
      {/* Hidden Canvas for QR frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleFileUpload}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={18} color="#38bdf8" />
          <strong style={{ fontSize: '15px' }}>Quét Mã QR Bàn Khám Bác Sĩ</strong>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Live Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '280px',
        background: '#000000',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {hasCamera ? (
          <>
            <video 
              ref={videoRef} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Target Reticle & Scanning Laser */}
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              border: '2px solid #0284c7',
              borderRadius: '16px',
              boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none'
            }}>
              {/* Animated Laser Bar */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '3px',
                background: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8, 0 0 20px #0284c7',
                animation: 'scanLaser 2s infinite ease-in-out'
              }} />
            </div>
            <style>{`
              @keyframes scanLaser {
                0% { top: 0%; opacity: 0.8; }
                50% { top: 96%; opacity: 1; }
                100% { top: 0%; opacity: 0.8; }
              }
            `}</style>
          </>
        ) : (
          <div style={{ padding: '20px', color: '#cbd5e1', fontSize: '13.5px' }}>
            <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '8px' }} />
            <p>{cameraError || 'Không thể mở Camera trên trình duyệt này.'}</p>
          </div>
        )}
      </div>

      <p style={{ margin: '14px 0 16px', fontSize: '13px', color: '#94a3b8' }}>
        Hướng camera vào mã QR hiển thị trên màn hình <strong>Clinic Dashboard</strong>
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Upload size={16} /> Chọn ảnh mã QR từ máy
        </button>

        <button
          onClick={startCamera}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={15} /> Thử lại
        </button>
      </div>
    </div>
  );
}
