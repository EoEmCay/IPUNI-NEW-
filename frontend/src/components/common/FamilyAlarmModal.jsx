import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Pill,
  CheckCircle2,
  MessageCircle,
  X,
  ZoomIn,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { notifyWithEffects } from '../../lib/notify';
import { cancelFollowupReminder, buildTodayInstant } from '../../lib/medReminders';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import {
  recordMedicationIntake,
  useMedicationAdherenceStore,
  getNextAlarmPayloadForToday,
} from '../../store/medicationAdherenceStore';
import useMedicationsStore from '../../store/medicationsStore';
import {
  classifySlotPeriod,
  getPeriodFullLabel,
} from '../../utils/medicationTime';
import {
  getSavedDrugVisual,
  fetchAndCacheDrugVisual,
} from '../../utils/drugVisuals';
import { getSavedCallerTitle } from '../../store/roleModeStore';
import styles from './FamilyAlarmModal.module.css';

// Hàm tiện ích kích hoạt màn hình Chuông Gọi Gia Đình từ bất kỳ đâu
export function triggerFamilyAlarm(payload = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('openFamilyAlarm', { detail: payload }));
}

function getSlotLabel(timeOrPeriod) {
  return getPeriodFullLabel(classifySlotPeriod(timeOrPeriod));
}

// Dữ liệu mẫu thực tế khi bấm Xem thử mà chưa quét đơn
const DEMO_FALLBACK_MEDS = [
  {
    id: 'demo-metformin',
    name: 'Glucophage (Metformin) 500mg',
    dosage: '1 viên',
    notes: 'Uống ngay sau bữa ăn cùng 1 ly nước ấm',
  },
  {
    id: 'demo-diamicron',
    name: 'Diamicron MR (Gliclazide) 30mg',
    dosage: '1 viên',
    notes: 'Uống cùng bữa ăn, không nhai hoặc bẻ viên thuốc',
  },
];

const BAR_COUNT = 44;

// Các mảnh pháo hoa chúc mừng khi cụ bấm hoặc nói ĐÃ UỐNG
const CONFETTI_PARTICLES = [
  { id: 1, tx: '-72px', ty: '-85px', rot: '-25deg', color: '#FDE047', delay: '0s' },
  { id: 2, tx: '-28px', ty: '-98px', rot: '18deg', color: '#38BDF8', delay: '0.04s' },
  { id: 3, tx: '16px', ty: '-92px', rot: '8deg', color: '#FDE047', delay: '0.02s' },
  { id: 4, tx: '62px', ty: '-80px', rot: '32deg', color: '#34D399', delay: '0.06s' },
  { id: 5, tx: '88px', ty: '-52px', rot: '-20deg', color: '#FDE047', delay: '0.03s' },
  { id: 6, tx: '68px', ty: '-18px', rot: '14deg', color: '#38BDF8', delay: '0.08s' },
  { id: 7, tx: '84px', ty: '22px', rot: '-18deg', color: '#FDE047', delay: '0.05s' },
  { id: 8, tx: '58px', ty: '48px', rot: '24deg', color: '#34D399', delay: '0.07s' },
  { id: 9, tx: '-82px', ty: '-48px', rot: '22deg', color: '#FDE047', delay: '0.04s' },
  { id: 10, tx: '-58px', ty: '-60px', rot: '-12deg', color: '#34D399', delay: '0.06s' },
  { id: 11, tx: '-76px', ty: '28px', rot: '28deg', color: '#38BDF8', delay: '0.03s' },
  { id: 12, tx: '-54px', ty: '46px', rot: '-30deg', color: '#FDE047', delay: '0.07s' },
  { id: 13, tx: '-22px', ty: '78px', rot: '6deg', color: '#38BDF8', delay: '0.05s' },
  { id: 14, tx: '18px', ty: '82px', rot: '-24deg', color: '#FDE047', delay: '0.09s' },
];

function isTakenConfirmationPhrase(rawText) {
  if (!rawText) return false;
  const text = rawText.toLowerCase().trim();
  const confirmPatterns = [
    'uống rồi',
    'tôi uống rồi',
    'tao uống rồi',
    'bố uống rồi',
    'ba uống rồi',
    'mẹ uống rồi',
    'má uống rồi',
    'mình uống rồi',
    'đã uống rồi',
    'đã uống',
    'uống xong rồi',
    'uống xong',
    'uống thuốc rồi',
  ];
  if (confirmPatterns.some((phrase) => text.includes(phrase))) {
    return true;
  }
  if (!text.includes('chưa') && (text === 'rồi' || text === 'uống' || text.includes('xong rồi'))) {
    return true;
  }
  return false;
}

export default function FamilyAlarmModal() {
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState([]);
  const [visualsMap, setVisualsMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  // Nguyên phần danh sách + hình ảnh thuốc mặc định thu gọn, khi nào người dùng cần xem mới bấm bung ra
  const [showMedSection, setShowMedSection] = useState(false);
  const [zoomedItem, setZoomedItem] = useState(null);

  const [slotTime, setSlotTime] = useState('07:00');
  const [slotPeriod, setSlotPeriod] = useState('morning');
  const [callerTitle, setCallerTitle] = useState('Con gái Trinh nhắc bố uống thuốc');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [confirmedDone, setConfirmedDone] = useState(false);
  const [speakingPrompt, setSpeakingPrompt] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [remainingSec, setRemainingSec] = useState(10);
  const [heardText, setHeardText] = useState('');

  const snoozeTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const listenTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const ttsFallbackTimerRef = useRef(null);
  const closeDoneTimerRef = useRef(null);
  const confirmedDoneRef = useRef(false);
  const openRef = useRef(false);
  const listeningWindowActiveRef = useRef(false);
  const handleConfirmRef = useRef(null);

  // Refs cho Web Audio API đo sóng âm THẬT (cả từ loa phát ra & từ micro của Bố)
  const barElsRef = useRef([]);
  const rafIdRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micFreqDataRef = useRef(null);

  const markMedicationStatus = useMedicationsStore((s) => s.markMedicationStatus);
  const logDose = useMedicationAdherenceStore((s) => s.logDose);

  // Tự động tra cứu ảnh thật hộp thuốc/vỉ thuốc trên mạng cho từng thuốc trong cữ
  const loadVisualsForMeds = useCallback(async (medList) => {
    const initial = {};
    (medList || []).forEach((m) => {
      initial[m.name] = getSavedDrugVisual(m.name);
    });
    setVisualsMap(initial);

    for (const m of medList || []) {
      if (!m?.name) continue;
      setLoadingMap((prev) => ({ ...prev, [m.name]: true }));
      const fetched = await fetchAndCacheDrugVisual(m.name);
      setVisualsMap((prev) => ({ ...prev, [m.name]: fetched }));
      setLoadingMap((prev) => ({ ...prev, [m.name]: false }));
    }
  }, []);

  // Đặt lại các vạch sóng về trạng thái phẳng yên tĩnh (khi không có tiếng nói)
  const resetBarsToFlat = useCallback(() => {
    for (let i = 0; i < BAR_COUNT; i++) {
      const el = barElsRef.current[i];
      if (el) {
        el.style.height = '10%';
      }
    }
  }, []);

  // Dừng luồng thu sóng âm từ micro của Bố
  const stopMicAnalyser = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    micAnalyserRef.current = null;
    micFreqDataRef.current = null;

    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        /* ignore */
      }
      micStreamRef.current = null;
    }

    if (micAudioCtxRef.current) {
      try {
        if (micAudioCtxRef.current.state !== 'closed') {
          micAudioCtxRef.current.close();
        }
      } catch {
        /* ignore */
      }
      micAudioCtxRef.current = null;
    }

    setVoiceActive(false);
    resetBarsToFlat();
  }, [resetBarsToFlat]);

  // Vòng lặp 60 FPS cập nhật chiều cao 44 vạch sóng âm theo đúng tần số âm thanh THẬT
  const startWaveformLoop = useCallback(
    (mode) => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      let lastLoudState = false;

      const tick = () => {
        if (!openRef.current || confirmedDoneRef.current) {
          resetBarsToFlat();
          return;
        }

        if (mode === 'playback') {
          const bands = voiceAlertService.getPlaybackBands(BAR_COUNT);
          if (bands) {
            for (let i = 0; i < BAR_COUNT; i++) {
              const el = barElsRef.current[i];
              if (el) {
                el.style.height = `${bands[i]}%`;
              }
            }
          } else {
            resetBarsToFlat();
          }
        } else if (mode === 'mic') {
          const analyser = micAnalyserRef.current;
          const freqData = micFreqDataRef.current;
          if (analyser && freqData) {
            analyser.getByteFrequencyData(freqData);
            const usableBins = Math.max(16, Math.floor(freqData.length * 0.65));
            let sumEnergy = 0;

            for (let i = 0; i < BAR_COUNT; i++) {
              // Đối xứng từ tâm ra 2 biên để giọng nói hiển thị tự nhiên như biểu đồ âm thanh thật
              const distFromCenter = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
              const binIdx = Math.min(
                usableBins - 1,
                Math.floor(distFromCenter * (usableBins - 1))
              );
              const raw = freqData[binIdx] || 0; // 0..255
              sumEnergy += raw;

              // Trừ ngưỡng nhiễu nền nhẹ (noise floor ~12) để khi im lặng sóng nằm phẳng
              const cleanVal = Math.max(0, raw - 12);
              const pct = Math.min(100, Math.max(10, Math.round(10 + (cleanVal / 185) * 90)));
              const el = barElsRef.current[i];
              if (el) {
                el.style.height = `${pct}%`;
              }
            }

            const avgEnergy = sumEnergy / BAR_COUNT;
            const isSpeakingNow = avgEnergy > 24;
            if (isSpeakingNow !== lastLoudState) {
              lastLoudState = isSpeakingNow;
              setVoiceActive(isSpeakingNow);
            }
          } else {
            resetBarsToFlat();
          }
        }

        rafIdRef.current = requestAnimationFrame(tick);
      };

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [resetBarsToFlat]
  );

  // Mở micro đo tần số giọng nói thật của Bố bằng Web Audio API
  const startRealMicAnalyser = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!openRef.current || confirmedDoneRef.current || !listeningWindowActiveRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.52;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      micAudioCtxRef.current = audioCtx;
      micAnalyserRef.current = analyser;
      micFreqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      startWaveformLoop('mic');
    } catch {
      // Nếu trình duyệt từ chối quyền mic riêng, vẫn giữ SpeechRecognition
      resetBarsToFlat();
    }
  }, [startWaveformLoop, resetBarsToFlat]);

  const stopSpeechRecognition = useCallback(() => {
    listeningWindowActiveRef.current = false;
    if (listenTimerRef.current) {
      clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (ttsFallbackTimerRef.current) {
      clearTimeout(ttsFallbackTimerRef.current);
      ttsFallbackTimerRef.current = null;
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
    stopMicAnalyser();
    setListening(false);
  }, [stopMicAnalyser]);

  const handleConfirmTaken = useCallback(() => {
    if (confirmedDoneRef.current) return;
    confirmedDoneRef.current = true;

    voiceAlertService.stopAlert();
    stopSpeechRecognition();
    setSpeakingPrompt(false);
    if (snoozeTimerRef.current) {
      clearTimeout(snoozeTimerRef.current);
      snoozeTimerRef.current = null;
    }

    const now = new Date();
    const instantIso = buildTodayInstant(slotTime, now);
    if (instantIso) {
      cancelFollowupReminder(instantIso);
    }

    const effectiveSlot = slotPeriod || classifySlotPeriod(slotTime);
    (meds || []).forEach((med) => {
      if (med && med.id && !String(med.id).startsWith('demo-')) {
        recordMedicationIntake(med, 'taken', now, null, effectiveSlot);
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
    setSnoozeCount(0);

    if (closeDoneTimerRef.current) clearTimeout(closeDoneTimerRef.current);
    closeDoneTimerRef.current = setTimeout(() => {
      openRef.current = false;
      setOpen(false);
      setConfirmedDone(false);
      confirmedDoneRef.current = false;
    }, 2600);
  }, [meds, slotTime, slotPeriod, markMedicationStatus, logDose, stopSpeechRecognition]);

  useEffect(() => {
    handleConfirmRef.current = handleConfirmTaken;
  }, [handleConfirmTaken]);

  // Tự động bật thu âm khoảng 10 giây ngay sau khi câu "Bố ơi, đến giờ uống thuốc..." vang xong
  const startAutoListen10s = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (confirmedDoneRef.current || !openRef.current) return;

    if (ttsFallbackTimerRef.current) {
      clearTimeout(ttsFallbackTimerRef.current);
      ttsFallbackTimerRef.current = null;
    }

    setSpeakingPrompt(false);
    stopSpeechRecognition();

    listeningWindowActiveRef.current = true;
    setListening(true);
    setRemainingSec(10);
    setHeardText('');

    // Kích hoạt phân tích biên độ sóng âm thật từ micro của Bố
    startRealMicAnalyser();

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const createAndStartRec = () => {
        if (!listeningWindowActiveRef.current || confirmedDoneRef.current || !openRef.current) {
          return;
        }
        try {
          const rec = new SpeechRec();
          rec.lang = 'vi-VN';
          rec.continuous = true;
          rec.interimResults = true;

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

            if (isTakenConfirmationPhrase(transcript)) {
              if (handleConfirmRef.current) {
                handleConfirmRef.current();
              }
            }
          };

          rec.onerror = () => {
            /* Giữ cửa sổ 10s nếu chỉ là lỗi tạm thời */
          };

          rec.onend = () => {
            if (listeningWindowActiveRef.current && !confirmedDoneRef.current && openRef.current) {
              try {
                rec.start();
              } catch {
                /* ignore */
              }
            } else {
              setListening(false);
            }
          };

          recognitionRef.current = rec;
          rec.start();
        } catch {
          /* ignore */
        }
      };

      createAndStartRec();
    }

    countdownIntervalRef.current = setInterval(() => {
      setRemainingSec((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    listenTimerRef.current = setTimeout(() => {
      stopSpeechRecognition();
    }, 10000);
  }, [stopSpeechRecognition, startRealMicAnalyser]);

  // Đọc câu ngắn gọn: "Bố ơi, đến giờ uống thuốc cử sáng rồi ạ!" (sóng nhảy theo tiếng đọc thật) rồi tự chuyển sang thu sóng âm của Bố
  const playVoice = useCallback(
    (timeOrPeriod) => {
      const slotLower = getSlotLabel(timeOrPeriod).toLowerCase();
      const tts = `Bố ơi, đến giờ uống thuốc ${slotLower} rồi ạ!`;

      setSpeakingPrompt(true);
      setListening(false);
      setHeardText('');

      // Bắt đầu vòng lặp đọc sóng âm thật từ âm thanh phát ra (playback)
      startWaveformLoop('playback');

      let startedListen = false;
      const triggerListenOnce = () => {
        if (startedListen) return;
        startedListen = true;
        if (!confirmedDoneRef.current && openRef.current) {
          startAutoListen10s();
        }
      };

      // Dự phòng nếu trình duyệt chặn autoplay hoặc không bắn sự kiện onended
      if (ttsFallbackTimerRef.current) clearTimeout(ttsFallbackTimerRef.current);
      ttsFallbackTimerRef.current = setTimeout(triggerListenOnce, 4500);

      notifyWithEffects(ALERT_TYPES.MED_ALL, {
        meds: [],
        ttsText: tts,
        onEnded: triggerListenOnce,
      });
    },
    [startAutoListen10s, startWaveformLoop]
  );

  const handleSkipOrLater = useCallback(() => {
    voiceAlertService.stopAlert();
    stopSpeechRecognition();
    setSpeakingPrompt(false);
    const nextCount = snoozeCount + 1;
    setSnoozeCount(nextCount);
    openRef.current = false;
    setOpen(false);

    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    snoozeTimerRef.current = setTimeout(() => {
      confirmedDoneRef.current = false;
      openRef.current = true;
      setConfirmedDone(false);
      setOpen(true);
      playVoice(slotPeriod || slotTime);
    }, 10 * 60 * 1000);
  }, [snoozeCount, slotTime, slotPeriod, playVoice, stopSpeechRecognition]);

  useEffect(() => {
    const onOpenAlarm = (e) => {
      const rawDetail = e.detail || {};
      const detail =
        Array.isArray(rawDetail.meds) &&
        rawDetail.meds.length > 0 &&
        typeof rawDetail.meds[0] === 'object' &&
        !rawDetail.slotPeriod &&
        !rawDetail.slotTime
          ? { ...rawDetail, ...getNextAlarmPayloadForToday(rawDetail.meds) }
          : rawDetail;

      const resolvedTime = detail.slotTime || '07:00';
      const resolvedPeriod = detail.slotPeriod || classifySlotPeriod(resolvedTime);

      const incomingMeds =
        Array.isArray(detail.meds) && detail.meds.length > 0
          ? detail.meds.map((m, idx) =>
              typeof m === 'string'
                ? {
                    id: `med-${idx}`,
                    name: m,
                    dosage: '1 viên',
                    notes: 'Uống sau ăn với 1 ly nước ấm',
                  }
                : {
                    ...m,
                    dosage: m.dosage || '1 viên',
                    notes: m.notes || m.instructions || 'Uống theo hướng dẫn của bác sĩ',
                  }
            )
          : DEMO_FALLBACK_MEDS;

      if (closeDoneTimerRef.current) {
        clearTimeout(closeDoneTimerRef.current);
        closeDoneTimerRef.current = null;
      }

      confirmedDoneRef.current = false;
      openRef.current = true;

      setMeds(incomingMeds);
      setSlotTime(resolvedTime);
      setSlotPeriod(resolvedPeriod);
      setCallerTitle(detail.callerName || getSavedCallerTitle());
      setConfirmedDone(false);
      setHeardText('');
      setShowMedSection(false);
      setZoomedItem(null);
      setOpen(true);

      loadVisualsForMeds(incomingMeds);
      playVoice(resolvedPeriod);
    };

    window.addEventListener('openFamilyAlarm', onOpenAlarm);
    return () => {
      window.removeEventListener('openFamilyAlarm', onOpenAlarm);
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
      if (closeDoneTimerRef.current) clearTimeout(closeDoneTimerRef.current);
      stopSpeechRecognition();
    };
  }, [loadVisualsForMeds, playVoice, stopSpeechRecognition]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Chuông nhắc uống thuốc kèm hình ảnh thuốc"
    >
      <div className={styles.phoneSheet}>
        {/* Thanh trạng thái an toàn trên cùng */}
        <div className={styles.topBar}>
          <span className={styles.safeBadge}>
            <ShieldCheck size={15} aria-hidden="true" />
            BÁO THỨC GIA ĐÌNH DIA+ · KHÔNG PHẢI SỐ LẠ
          </span>
          <button
            type="button"
            className={styles.closeMini}
            onClick={() => {
              openRef.current = false;
              voiceAlertService.stopAlert();
              stopSpeechRecognition();
              setSpeakingPrompt(false);
              setOpen(false);
            }}
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {confirmedDone ? (
          <div className={styles.doneCenter}>
            <div className={styles.celebrationWrap}>
              {/* Pháo hoa / Confetti bung ra khi hoàn thành */}
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

              <div className={styles.doneIcon}>
                <CheckCircle2 size={54} strokeWidth={2.6} />
              </div>
            </div>

            <h2 className={styles.doneTitle}>Tuyệt vời bố ơi!</h2>
            <p className={styles.doneDesc}>
              Đã ghi nhận bố uống đủ <strong>{meds.length} loại thuốc</strong> ({getSlotLabel(slotTime)}).
            </p>
            <div className={styles.zaloSentBadge}>
              <MessageCircle size={18} />
              Đã báo tin vui về cho con gái Trinh yên tâm ❤️
            </div>
          </div>
        ) : (
          <>
            {/* Banner người thân nhắc uống thuốc + Sóng âm nhảy theo âm thanh THẬT */}
            <div className={styles.callerBanner}>
              <div className={styles.avatarRingWrap}>
                <span className={styles.pulseRing} />
                <img
                  src="/avatar-logo.jpg"
                  alt="Ảnh đại diện gia đình"
                  className={styles.avatarCircle}
                />
              </div>

              <div className={styles.callerMeta}>
                <h2 className={styles.callerName}>{callerTitle}</h2>

                {/* Dải sóng âm thật: nhảy theo tần số âm thanh phát ra & tần số micro khi Bố nói */}
                <div
                  className={`${styles.waveformBox} ${
                    listening ? styles.waveformListening : ''
                  } ${voiceActive ? styles.waveformVoiceSpike : ''}`}
                  onClick={() => {
                    if (!listening && !speakingPrompt) {
                      startAutoListen10s();
                    }
                  }}
                  title="Sóng âm nhảy theo âm thanh thật (Chạm để bật lại thu âm nếu cần)"
                >
                  <div className={styles.waveformBars} aria-hidden="true">
                    {Array.from({ length: BAR_COUNT }).map((_, i) => (
                      <span
                        key={i}
                        ref={(el) => {
                          barElsRef.current[i] = el;
                        }}
                        className={styles.waveBar}
                      />
                    ))}
                  </div>

                  <div className={styles.waveformStatus}>
                    {speakingPrompt ? (
                      <span>🔊 “Bố ơi, đến giờ uống thuốc {getSlotLabel(slotTime).toLowerCase()} rồi ạ!”</span>
                    ) : listening ? (
                      <span>
                        🎙️ {heardText ? `Nghe thấy: “${heardText}”` : `Đến lượt Bố nói (“Uống rồi”) · ${remainingSec}s`}
                      </span>
                    ) : (
                      <span>🎙️ Chạm để nói “Uống rồi” nếu Bố đang bận tay</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* NGUYÊN KHỐI THUỐC & HÌNH ẢNH: Mặc định thu gọn thành 1 thanh; bấm vào mới bung toàn bộ danh sách kèm ảnh */}
            <div className={styles.medSection}>
              <button
                type="button"
                className={`${styles.medSectionToggleBtn} ${
                  showMedSection ? styles.medSectionToggleExpanded : ''
                }`}
                onClick={() => setShowMedSection((prev) => !prev)}
              >
                <span className={styles.medSectionTitle}>
                  <Pill size={18} />
                  Nhìn hình để lấy đúng thuốc ({meds.length} loại)
                </span>
                <span className={styles.medSectionActionBadge}>
                  {showMedSection ? (
                    <>
                      Thu gọn <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Bấm xem thuốc <ChevronDown size={16} />
                    </>
                  )}
                </span>
              </button>

              {showMedSection && (
                <div className={styles.medVisualList}>
                  {meds.map((m, idx) => {
                    const vis = visualsMap[m.name] || getSavedDrugVisual(m.name);
                    const isLoading = loadingMap[m.name];

                    return (
                      <div key={m.id || idx} className={styles.medVisualCard}>
                        <div className={styles.medVisualTop}>
                          {/* Ô ảnh thật hộp thuốc / vỉ thuốc hiện ra luôn như cái cũ */}
                          <div
                            className={styles.photoBox}
                            onClick={() =>
                              vis.imageUrl &&
                              setZoomedItem({
                                name: m.name,
                                dosage: m.dosage,
                                appearance: vis.appearance,
                                imageUrl: vis.imageUrl,
                              })
                            }
                            title="Bấm để phóng to ảnh thuốc"
                          >
                            {vis.imageUrl ? (
                              <>
                                <img
                                  src={vis.imageUrl}
                                  alt={m.name}
                                  className={styles.drugPhoto}
                                  onError={(e) => {
                                    const nextCandidate = (vis.candidates || []).find(
                                      (c) => c !== vis.imageUrl
                                    );
                                    if (nextCandidate) {
                                      e.currentTarget.src = nextCandidate;
                                    }
                                  }}
                                />
                                <span className={styles.zoomHintBadge}>
                                  <ZoomIn size={11} /> Phóng to
                                </span>
                              </>
                            ) : (
                              <span className={styles.photoLoading}>
                                {isLoading ? 'Đang tìm ảnh thuốc...' : 'Chưa có ảnh'}
                              </span>
                            )}
                          </div>

                          {/* Thông tin bình dân dễ hiểu cho người già giống cái cũ */}
                          <div className={styles.medDetailCol}>
                            <span className={styles.commonPurposeTag}>{vis.commonName}</span>
                            <h3 className={styles.medTitle}>{m.name}</h3>
                            <span className={styles.doseHighlight}>
                              Uống: {m.dosage || '1 viên'}
                            </span>
                            <div className={styles.appearanceBox}>
                              💊 <strong>Nhận diện:</strong> {vis.appearance}
                            </div>
                            {m.notes && <div className={styles.medNotes}>📌 {m.notes}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2 nút hành động chính: TÔI ĐÃ UỐNG THUỐC và CÓ LẼ ĐỂ LẦN SAU */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnTake}
                onClick={handleConfirmTaken}
              >
                <CheckCircle2 size={28} strokeWidth={2.8} />
                TÔI ĐÃ UỐNG THUỐC
              </button>

              <button
                type="button"
                className={styles.btnLater}
                onClick={handleSkipOrLater}
              >
                CÓ LẼ ĐỂ LẦN SAU
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lightbox phóng to ảnh hộp thuốc toàn màn hình khi cụ bấm vào ảnh */}
      {zoomedItem && (
        <div className={styles.zoomModal} onClick={() => setZoomedItem(null)}>
          <img
            src={zoomedItem.imageUrl}
            alt={zoomedItem.name}
            className={styles.zoomImg}
            onClick={(e) => e.stopPropagation()}
          />
          <div className={styles.zoomCaption}>
            <h3 className={styles.zoomTitle}>{zoomedItem.name}</h3>
            <p className={styles.zoomSub}>
              Liều uống: {zoomedItem.dosage} · {zoomedItem.appearance}
            </p>
            <button
              type="button"
              className={styles.zoomCloseBtn}
              onClick={() => setZoomedItem(null)}
            >
              Đóng ảnh phóng to
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
