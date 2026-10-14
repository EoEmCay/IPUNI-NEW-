import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Volume2,
} from 'lucide-react';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { getSavedDrugVisual } from '../../utils/drugVisuals';
import { recordMedicationIntake } from '../../store/medicationAdherenceStore';
import styles from './SecretPillBoxModal.module.css';

// Dữ liệu thuốc mẫu thực tế cho cữ trưa/sáng khi chưa quét đơn
const DEFAULT_PREVIEW_MEDS = [
  {
    id: 'demo-metformin',
    name: 'Glucophage 500mg (Metformin)',
    dosage: '1 viên',
    instruction: 'Uống 1 viên ngay sau bữa ăn',
    period: 'Trưa nay',
  },
  {
    id: 'demo-diamicron',
    name: 'Diamicron MR 30mg (Gliclazide)',
    dosage: '1 viên',
    instruction: 'Uống 1 viên cùng bữa ăn, nuốt trọn viên',
    period: 'Trưa nay',
  },
  {
    id: 'demo-amlodipine',
    name: 'Amlodipine 5mg',
    dosage: '1 viên',
    instruction: 'Uống 1 viên cùng 1 ly nước lọc',
    period: 'Trưa nay',
  },
];

// Âm thanh chuông báo bấm tick nhẹ nhàng (Web Audio API)
function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch {
    // ignore
  }
}

// Âm thanh pháo hoa chúc mừng hoàn thành
function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.1;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // ignore
  }
}

export default function SecretPillBoxModal({
  isOpen = true,
  onClose,
  medications = [],
  slotTitle = 'Cữ Thuốc Của Cụ',
}) {
  // Chuẩn hóa danh sách thuốc hiển thị
  const activeMeds = medications && medications.length > 0 ? medications : DEFAULT_PREVIEW_MEDS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [takenStatusMap, setTakenStatusMap] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const canvasRef = useRef(null);
  const touchStartXRef = useRef(0);
  const autoNextTimeoutRef = useRef(null);

  const total = activeMeds.length;
  const currentMed = activeMeds[currentIndex] || activeMeds[0];
  const isCurrentTaken = Boolean(takenStatusMap[currentMed?.id || currentIndex]);
  const takenCount = Object.values(takenStatusMap).filter(Boolean).length;
  const allTaken = total > 0 && takenCount >= total;

  // Lấy ảnh thật từ thư viện thuốc
  const drugVisual = getSavedDrugVisual(currentMed?.name || '');
  const drugImgSrc =
    drugVisual?.imageUrl ||
    'https://cdn.nhathuoclongchau.com.vn/v1/static/IMG_1363_8965617dac.jpg';

  // 1. Tự động phát giọng đọc của con dưới nền (Ẩn hoàn toàn giao diện audio)
  useEffect(() => {
    if (!isOpen) return;

    const medNames = activeMeds.map((m) => m.name || m.label || 'thuốc').join(', ');
    const greetingText = `Bố ơi, đến giờ uống thuốc rồi ạ. Con mở sẵn hộp thuốc cho bố đây, cữ này có ${medNames}. Bố uống từng viên rồi bấm chạm vào hình để con yên tâm nhé!`;

    voiceAlertService.playAlert(
      ALERT_TYPES.MED_ALL,
      activeMeds.map((m) => m.name),
      null,
      greetingText
    );

    return () => {
      voiceAlertService.stopAlert();
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chuyển card tiếp theo
  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, total]);

  // Quay lại card trước
  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Xử lý khi cụ BẤM TICK TRỰC TIẾP LÊN HÌNH ẢNH HỘP THUỐC
  const handleToggleDrug = () => {
    const medKey = currentMed?.id || currentIndex;
    const nextTaken = !isCurrentTaken;

    setTakenStatusMap((prev) => ({
      ...prev,
      [medKey]: nextTaken,
    }));

    if (nextTaken) {
      playSoftChime();

      // Tự động lướt sang phải loại thuốc tiếp theo sau hiệu ứng gạch ngang
      if (currentIndex < total - 1) {
        if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = setTimeout(() => {
          setCurrentIndex((idx) => Math.min(idx + 1, total - 1));
        }, 480);
      }
    }
  };

  // Vuốt chạm trên màn hình (Touch swipe)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      goNext();
    } else if (diff < -50) {
      goPrev();
    }
  };

  // Bấm nút "HOÀN THÀNH CỮ THUỐC" màu xanh lá ở dưới
  const handleCompleteAll = () => {
    setIsCompleted(true);
    playCelebrationSound();

    // Ghi nhận nhật ký uống thuốc vào hệ thống
    const now = new Date();
    activeMeds.forEach((med) => {
      if (med && med.id && !String(med.id).startsWith('demo-')) {
        recordMedicationIntake(med, 'taken', now);
      }
    });

    // Kích hoạt hiệu ứng pháo hoa Confetti rực rỡ
    launchFireworks();

    // Tự động đóng sau 2.8 giây
    setTimeout(() => {
      if (onClose) onClose();
    }, 2800);
  };

  // Canvas hiệu ứng pháo hoa / confetti siêu nhẹ và mượt mà
  const launchFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const colors = ['#10b981', '#fbbf24', '#38bdf8', '#f43f5e', '#a855f7', '#34d399'];
    const particles = [];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: width / 2,
        y: height / 2 + 40,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.8) * 11,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        gravity: 0.22,
        alpha: 1,
      });
    }

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.alpha -= 0.009;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      }
    };
    render();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Đường viền lấp lánh (Shimmer nhẹ nhàng, không chói, phong cách hộp quà bí mật) */}
        <div className={styles.shimmerBorder} />

        {/* Các ngôi sao lấp lánh nhẹ ở góc */}
        <Sparkles className={`${styles.sparkleIcon} ${styles.sparkleTopLeft}`} size={20} />
        <Sparkles className={`${styles.sparkleIcon} ${styles.sparkleTopRight}`} size={16} />

        {/* Nút đóng nhỏ gọn ở góc */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Đóng hộp thuốc"
          type="button"
        >
          <X size={18} />
        </button>

        {/* Header cữ thuốc & tiến độ */}
        <div className={styles.headerWrap}>
          <div className={styles.periodPill}>
            <Sparkles size={14} />
            <span>{slotTitle}</span>
          </div>

          {/* Dòng chữ vàng lấp lánh "TỚI GIỜ UỐNG THUỐC RỒI" */}
          <div className={styles.shimmerAlertText}>
            <Sparkles size={14} />
            <span>TỚI GIỜ UỐNG THUỐC RỒI</span>
            <Sparkles size={14} />
          </div>

          <div className={styles.progressLabel}>
            Thuốc {currentIndex + 1} / {total} · Đã uống: {takenCount}/{total}
          </div>
        </div>

        {/* Khung ảnh thuốc lớn ở trung tâm: Chạm để tick đã uống */}
        <div
          className={styles.cardStage}
          onClick={handleToggleDrug}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          title="Bấm vào ảnh để xác nhận đã uống"
        >
          <img
            src={drugImgSrc}
            alt={currentMed.name}
            className={`${styles.drugImage} ${isCurrentTaken ? styles.drugImageDone : ''}`}
            loading="eager"
          />

          {/* Dấu gạch ngang màu đỏ sinh động khi đã uống */}
          {isCurrentTaken && <div className={styles.strikeOverlay} />}

          {/* Con dấu xanh lá "ĐÃ UỐNG" đóng lên ảnh */}
          {isCurrentTaken && (
            <div className={styles.stampTaken}>
              <Check size={22} strokeWidth={3.5} />
              <span>ĐÃ UỐNG</span>
            </div>
          )}

          {/* Gợi ý chạm nhẹ nếu chưa uống */}
          {!isCurrentTaken && (
            <div className={styles.tapHintBar}>
              <Check size={14} />
              <span>Chạm vào ảnh khi đã uống xong</span>
            </div>
          )}
        </div>

        {/* Thông tin tên thuốc & liều lượng bên dưới ảnh */}
        <div className={styles.infoSection}>
          <h3
            className={`${styles.drugName} ${isCurrentTaken ? styles.drugNameDone : ''}`}
          >
            {currentMed.name}
          </h3>
          <p className={styles.drugInstruction}>
            Liều lượng: <strong>{currentMed.dosage || '1 viên'}</strong>
            {currentMed.instruction ? ` · ${currentMed.instruction}` : ''}
          </p>
        </div>

        {/* Thanh điều hướng lướt qua lại & chấm tròn tiến độ */}
        <div className={styles.navRow}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="Thuốc trước"
          >
            <ChevronLeft size={22} />
          </button>

          <div className={styles.dotsRow}>
            {activeMeds.map((m, idx) => {
              const isTaken = Boolean(takenStatusMap[m.id || idx]);
              const isActive = idx === currentIndex;
              return (
                <div
                  key={m.id || idx}
                  className={`${styles.dotIndicator} ${
                    isActive ? styles.dotIndicatorActive : ''
                  } ${isTaken ? styles.dotIndicatorTaken : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              );
            })}
          </div>

          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            disabled={currentIndex === total - 1}
            aria-label="Thuốc tiếp theo"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Nút Hoàn Thành Cữ Thuốc màu xanh lá rực rỡ */}
        {allTaken ? (
          <button
            type="button"
            className={styles.completeButton}
            onClick={handleCompleteAll}
          >
            <Check size={22} strokeWidth={3} />
            <span>HOÀN THÀNH CỮ THUỐC</span>
          </button>
        ) : (
          <div className={styles.guideButton} role="note" aria-live="polite">
            <span>Bấm vào ảnh trên để gạch bỏ</span>
          </div>
        )}

        {/* Canvas pháo hoa khi hoàn thành */}
        <canvas ref={canvasRef} className={styles.fireworksCanvas} />

        {/* Màn hình chúc mừng khi bấm Hoàn thành */}
        {isCompleted && (
          <div className={styles.congratsOverlay}>
            <div className={styles.congratsIconWrap}>
              <Check size={44} strokeWidth={4} />
            </div>
            <h2 className={styles.congratsTitle}>Hoan Hô Cụ Ơi!</h2>
            <p className={styles.congratsDesc}>
              Cụ đã uống đầy đủ các thuốc của cữ này. Con cháu đã nhận được thông báo an tâm rồi ạ!
            </p>
            <button
              type="button"
              className={styles.congratsCloseBtn}
              onClick={onClose}
            >
              Đóng lại
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
