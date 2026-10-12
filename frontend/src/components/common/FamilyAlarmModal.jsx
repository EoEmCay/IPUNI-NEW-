import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { notifyWithEffects } from '../../lib/notify';
import { cancelFollowupReminder, buildTodayInstant } from '../../lib/medReminders';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import {
  recordMedicationIntake,
  useMedicationAdherenceStore,
} from '../../store/medicationAdherenceStore';
import useMedicationsStore from '../../store/medicationsStore';
import styles from './FamilyAlarmModal.module.css';

// Hàm tiện ích kích hoạt màn hình Chuông Nhắc Thuốc từ bất kỳ đâu
export function triggerFamilyAlarm(payload = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('openFamilyAlarm', { detail: payload }));
}

function getSlotLabel(timeStr) {
  const parts = String(timeStr || '07:00').split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1] || '0', 10);
  if (isNaN(hour)) return 'cử sáng';
  const totalMinutes = hour * 60 + (isNaN(minute) ? 0 : minute);
  // Khung giờ cố định: 04:00 - 12:00 là cử sáng, 12:30 - 17:00 là cử chiều, còn lại là cử tối
  if (totalMinutes >= 4 * 60 && totalMinutes <= 12 * 60) return 'cử sáng';
  if (totalMinutes > 12 * 60 && totalMinutes <= 17 * 60) return 'cử chiều';
  return 'cử tối';
}

// Danh sách các mảnh pháo hoa / confetti (vàng gold & xanh cyan giống Ảnh 5)
const CONFETTI_PARTICLES = [
  { id: 1, tx: '-68px', ty: '-88px', rot: '-25deg', color: '#38BDF8', delay: '0s' },
  { id: 2, tx: '-28px', ty: '-102px', rot: '18deg', color: '#38BDF8', delay: '0.04s' },
  { id: 3, tx: '12px', ty: '-95px', rot: '8deg', color: '#EAB308', delay: '0.02s' },
  { id: 4, tx: '58px', ty: '-82px', rot: '32deg', color: '#38BDF8', delay: '0.06s' },
  { id: 5, tx: '88px', ty: '-54px', rot: '-20deg', color: '#EAB308', delay: '0.03s' },
  { id: 6, tx: '64px', ty: '-22px', rot: '14deg', color: '#EAB308', delay: '0.08s' },
  { id: 7, tx: '84px', ty: '18px', rot: '-18deg', color: '#EAB308', delay: '0.05s' },
  { id: 8, tx: '98px', ty: '42px', rot: '24deg', color: '#38BDF8', delay: '0.07s' },
  { id: 9, tx: '56px', ty: '28px', rot: '15deg', color: '#38BDF8', delay: '0.02s' },
  { id: 10, tx: '-82px', ty: '-52px', rot: '22deg', color: '#EAB308', delay: '0.04s' },
  { id: 11, tx: '-54px', ty: '-62px', rot: '-12deg', color: '#EAB308', delay: '0.06s' },
  { id: 12, tx: '-76px', ty: '26px', rot: '28deg', color: '#38BDF8', delay: '0.03s' },
  { id: 13, tx: '-58px', ty: '38px', rot: '-30deg', color: '#EAB308', delay: '0.07s' },
  { id: 14, tx: '-26px', ty: '86px', rot: '6deg', color: '#38BDF8', delay: '0.05s' },
  { id: 15, tx: '-8px', ty: '98px', rot: '-24deg', color: '#EAB308', delay: '0.09s' },
  { id: 16, tx: '38px', ty: '-58px', rot: '12deg', color: '#EAB308', delay: '0.04s' },
];

function isTakenConfirmationPhrase(rawText) {
  if (!rawText) return false;
  const text = rawText.toLowerCase().trim();
  const confirmPatterns = [
    'uống rồi',
    'tôi uống rồi',
    'tao uống rồi',
    'bố uống rồi',
    'mẹ uống rồi',
    'ba uống rồi',
    'má uống rồi',
    'đã uống rồi',
    'đã uống',
    'uống xong rồi',
    'uống xong',
    'uống thuốc rồi',
  ];
  if (confirmPatterns.some((phrase) => text.includes(phrase))) {
    return true;
  }
  // Nếu câu ngắn chỉ nói "rồi" hoặc "xong rồi" (và không có chữ "chưa")
  if (!text.includes('chưa') && (text === 'rồi' || text.includes('xong rồi'))) {
    return true;
  }
  return false;
}

export default function FamilyAlarmModal() {
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState([]);
  const [slotTime, setSlotTime] = useState('07:00');
  const [confirmedDone, setConfirmedDone] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingPrompt, setSpeakingPrompt] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [remainingSec, setRemainingSec] = useState(10);

  const recognitionRef = useRef(null);
  const listenTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const closeDoneTimerRef = useRef(null);
  const confirmedDoneRef = useRef(false);
  const openRef = useRef(false);
  const handleConfirmRef = useRef(null);

  const markMedicationStatus = useMedicationsStore((s) => s.markMedicationStatus);
  const logDose = useMedicationAdherenceStore((s) => s.logDose);

  const stopSpeechRecognition = useCallback(() => {
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const handleConfirmTaken = useCallback(() => {
    if (confirmedDoneRef.current) return;
    confirmedDoneRef.current = true;

    // Dừng ngay lập tức âm thanh đang đọc & thu âm giọng nói
    voiceAlertService.stopAlert();
    stopSpeechRecognition();
    setSpeakingPrompt(false);

    const now = new Date();
    const instantIso = buildTodayInstant(slotTime, now);
    if (instantIso) {
      cancelFollowupReminder(instantIso);
    }

    (meds || []).forEach((med) => {
      if (med && med.id && !String(med.id).startsWith('demo-')) {
        recordMedicationIntake(med, 'taken', now, null, slotTime);
        if (typeof markMedicationStatus === 'function') {
          markMedicationStatus(med.id, 'taken');
        }
        if (typeof logDose === 'function') {
          logDose(med.id, {
            slot: slotTime,
            scheduledFor: instantIso || now.toISOString(),
            status: 'taken',
          });
        }
      }
    });

    setConfirmedDone(true);

    if (closeDoneTimerRef.current) clearTimeout(closeDoneTimerRef.current);
    closeDoneTimerRef.current = setTimeout(() => {
      openRef.current = false;
      setOpen(false);
      setConfirmedDone(false);
      confirmedDoneRef.current = false;
    }, 2800);
  }, [meds, slotTime, markMedicationStatus, logDose, stopSpeechRecognition]);

  useEffect(() => {
    handleConfirmRef.current = handleConfirmTaken;
  }, [handleConfirmTaken]);

  // Tự động bật thu âm khoảng 10 giây ngay sau khi câu "Bố ơi,..." vang xong
  const startAutoListen10s = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (confirmedDoneRef.current || !openRef.current) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    stopSpeechRecognition();

    try {
      const rec = new SpeechRec();
      rec.lang = 'vi-VN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        if (confirmedDoneRef.current || !openRef.current) {
          stopSpeechRecognition();
          return;
        }
        setListening(true);
        setRemainingSec(10);
      };

      rec.onresult = (event) => {
        if (confirmedDoneRef.current) return;
        const transcript = Array.from(event.results)
          .map((r) => r[0]?.transcript || '')
          .join(' ')
          .toLowerCase()
          .trim();

        if (transcript) {
          setHeardText(transcript);
        }

        // Kiểm tra xem người dùng đã nói câu xác nhận uống thuốc chưa
        if (isTakenConfirmationPhrase(transcript)) {
          if (handleConfirmRef.current) {
            handleConfirmRef.current();
          }
          return;
        }

        // Nếu người nói đã dứt câu (isFinal) mà chưa khớp câu xác nhận, vẫn giữ lắng nghe trong vòng 10s
      };

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();

      // Đếm ngược 10 giây tự động tắt thu âm
      countdownIntervalRef.current = setInterval(() => {
        setRemainingSec((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      listenTimerRef.current = setTimeout(() => {
        stopSpeechRecognition();
      }, 10000);
    } catch {
      setListening(false);
    }
  }, [stopSpeechRecognition]);

  const playConciseVoiceAndAutoListen = useCallback(
    (timeStr) => {
      const slotText = getSlotLabel(timeStr);
      // Ngắn gọn đúng theo yêu cầu: "Bố ơi, đến giờ uống thuốc cử sáng rồi ạ!"
      const tts = `Bố ơi, đến giờ uống thuốc ${slotText} rồi ạ!`;
      setSpeakingPrompt(true);

      notifyWithEffects(ALERT_TYPES.MED_ALL, {
        meds: [],
        ttsText: tts,
        onEnded: () => {
          setSpeakingPrompt(false);
          if (!confirmedDoneRef.current && openRef.current) {
            startAutoListen10s();
          }
        },
      });
    },
    [startAutoListen10s]
  );

  useEffect(() => {
    const onOpenAlarm = (e) => {
      const detail = e.detail || {};
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const resolvedTime = detail.slotTime || defaultTime;

      const incomingMeds =
        Array.isArray(detail.meds) && detail.meds.length > 0
          ? detail.meds.map((m, idx) =>
              typeof m === 'string'
                ? { id: `med-${idx}`, name: m, dosage: '1 viên' }
                : m
            )
          : [];

      if (closeDoneTimerRef.current) {
        clearTimeout(closeDoneTimerRef.current);
        closeDoneTimerRef.current = null;
      }

      confirmedDoneRef.current = false;
      openRef.current = true;

      setMeds(incomingMeds);
      setSlotTime(resolvedTime);
      setConfirmedDone(false);
      setHeardText('');
      setOpen(true);

      playConciseVoiceAndAutoListen(resolvedTime);
    };

    window.addEventListener('openFamilyAlarm', onOpenAlarm);
    return () => {
      window.removeEventListener('openFamilyAlarm', onOpenAlarm);
      if (closeDoneTimerRef.current) clearTimeout(closeDoneTimerRef.current);
      stopSpeechRecognition();
    };
  }, [playConciseVoiceAndAutoListen, stopSpeechRecognition]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Đã đến giờ uống thuốc"
    >
      {/* Các vòng sóng đồng tâm lan tỏa phía sau như Ảnh 4 & Ảnh 5 */}
      <div className={styles.rippleRings} aria-hidden="true">
        <span className={styles.ring1} />
        <span className={styles.ring2} />
        <span className={styles.ring3} />
        <span className={styles.ring4} />
      </div>

      <div className={styles.phoneSheet}>
        <div className={styles.innerDashedFrame}>
          {/* Nút đóng nhỏ gọn góc trên phải */}
          <button
            type="button"
            className={styles.closeMini}
            onClick={() => {
              openRef.current = false;
              voiceAlertService.stopAlert();
              stopSpeechRecognition();
              setOpen(false);
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          {/* Thanh thông báo trên cùng chuẩn Ảnh 4 */}
          <div className={styles.notifBanner}>
            <div className={styles.logoBox} aria-hidden="true">
              <span className={styles.logoD}>D</span>
              <span className={styles.logoPlus}>+</span>
            </div>
            <div className={styles.notifTextCol}>
              <div className={styles.notifMeta}>DIA+ • bây giờ</div>
              <h2 className={styles.notifTitle}>Đã đến giờ uống thuốc</h2>
            </div>
          </div>

          {/* Khu vực trung tâm: Trước khi bấm (chấm vàng thu âm tự động) / Sau khi bấm (Vòng tròn dấu tick vàng + Pháo hoa giống Ảnh 5) */}
          <div className={styles.centerStage}>
            {confirmedDone ? (
              <div className={styles.celebrationWrap}>
                {/* Hiệu ứng pháo hoa / confetti bung ra xung quanh vòng tròn tick */}
                <div className={styles.confettiBurst} aria-hidden="true">
                  {CONFETTI_PARTICLES.map((p) => (
                    <span
                      key={p.id}
                      className={styles.confettiPiece}
                      style={{
                        '--tx': p.tx,
                        '--ty': p.ty,
                        '--rot': p.rot,
                        '--c': p.color,
                        animationDelay: p.delay,
                      }}
                    />
                  ))}
                </div>

                {/* Vòng tròn vàng với dấu tick vàng ở chính giữa chuẩn Ảnh 5 */}
                <div className={styles.goldCheckCircle}>
                  <svg
                    viewBox="0 0 64 64"
                    className={styles.goldCheckSvg}
                    aria-hidden="true"
                  >
                    <path
                      d="M18 33.5L28 43.5L47 21.5"
                      fill="none"
                      stroke="#F0C954"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className={styles.listeningStage}>
                <span
                  className={`${styles.goldDot} ${
                    listening || speakingPrompt ? styles.goldDotActive : ''
                  }`}
                />
                {speakingPrompt && (
                  <p className={styles.voiceHintText}>
                    “Bố ơi, đến giờ uống thuốc {getSlotLabel(slotTime)} rồi ạ!”
                  </p>
                )}
                {!speakingPrompt && listening && (
                  <p className={styles.voiceHintText}>
                    Đang nghe ({remainingSec}s)... Nói <strong>“Uống rồi”</strong>
                    {heardText ? ` · "${heardText}"` : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Nút bấm khổng lồ màu vàng "ĐÃ UỐNG" giống hệt Ảnh 4 & Ảnh 5 */}
          <div className={styles.actionArea}>
            <button
              type="button"
              className={styles.btnDaUong}
              onClick={handleConfirmTaken}
            >
              ĐÃ UỐNG
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
