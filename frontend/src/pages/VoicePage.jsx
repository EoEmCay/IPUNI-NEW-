import { useState, useEffect, useRef } from 'react';
import { Settings, Mic, Square, Play, Trash2, Activity } from 'lucide-react';
import { voiceAlertService, ALERT_TYPES } from '../services/voiceAlert.service';
import { useT } from '../hooks/useT';
// Dùng chung style với trang Cài đặt (trước đây 2 phần này nằm chung 1 trang)
import styles from './SettingsPage.module.css';
import PageHeader from '../components/common/PageHeader';

const ALERT_CONFIG = [
  {
    id: ALERT_TYPES.MED_ALL,
    titleKey: 'medAlertTitle',
    descKey: 'medAlertDesc',
    icon: <Settings size={18} />
  },
  {
    id: ALERT_TYPES.SUGAR_HIGH,
    titleKey: 'sugarHighTitle',
    descKey: 'sugarHighDesc',
    icon: <Activity size={18} />
  },
  {
    id: ALERT_TYPES.FAMILY,
    titleKey: 'familyAlertTitle',
    descKey: 'familyAlertDesc',
    icon: <Settings size={18} />
  },
  {
    id: ALERT_TYPES.SUGAR_LOW,
    titleKey: 'sugarLowTitle',
    descKey: 'sugarLowDesc',
    icon: <Activity size={18} />
  }
];

// Trang "Giọng nhắc": ghi âm giọng con cháu để app đọc khi nhắc thuốc / cảnh báo đường huyết.
export default function VoicePage() {
  const t = useT();
  const s = t.settings;

  const [settings, setSettings] = useState({});
  const [recordingId, setRecordingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadSettings = async () => {
    const data = await voiceAlertService.getAllSettings();
    setSettings(data);
  };

  useEffect(() => {
    loadSettings();
    return () => {
      voiceAlertService.stopAlert();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = async (alertType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Lấy định dạng thực tế của thiết bị (iOS Safari thường là audio/mp4, không phải webm)
        const mimeType = audioChunksRef.current[0]?.type || mediaRecorderRef.current.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await voiceAlertService.saveVoice(alertType, audioBlob);
        loadSettings();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (streamRef.current === stream) {
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingId(alertType);
    } catch {
      alert(s.micError);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecordingId(null);
  };

  const handlePlayVoice = (alertType) => {
    if (playingId === alertType) {
      voiceAlertService.stopAlert();
      setPlayingId(null);
    } else {
      voiceAlertService.stopAlert();
      setPlayingId(alertType);
      voiceAlertService.playAlert(alertType, [], () => {
        setPlayingId(null);
      });
    }
  };

  const deleteVoice = async (alertType) => {
    if (window.confirm(s.deleteConfirm)) {
      await voiceAlertService.deleteVoice(alertType);
      loadSettings();
    }
  };

  const toggleCustomVoice = async (alertType, isChecked) => {
    await voiceAlertService.toggleCustomVoice(alertType, isChecked);
    loadSettings();
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Giọng nhắc" subtitle={s.voiceDesc} />

      <div className={styles.alertList}>
        {ALERT_CONFIG.map((item) => {
          const setting = settings[item.id] || {};
          const hasVoice = !!setting.audioBase64;
          const useCustom = hasVoice && setting.useCustomVoice !== false;
          const isRecording = recordingId === item.id;

          return (
            <div key={item.id} className={styles.alertCard}>
              <div className={styles.alertHeader}>
                <h3 className={styles.alertTitle}>{s[item.titleKey]}</h3>
                {hasVoice && (
                  <div className={styles.toggleGroup}>
                    <span>{s.useCustomVoice}</span>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={useCustom}
                        onChange={(e) => toggleCustomVoice(item.id, e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                )}
              </div>
              <p className={styles.alertDesc}>{s[item.descKey]}</p>
              
              <div className={styles.controls}>
                <div className={styles.recordGroup}>
                  {isRecording ? (
                    <button className={`${styles.iconBtn} ${styles.recording}`} onClick={stopRecording}>
                      <Square size={16} fill="currentColor" />
                    </button>
                  ) : (
                    <button className={`${styles.iconBtn} ${styles.recordBtn}`} onClick={() => startRecording(item.id)}>
                      <Mic size={20} />
                    </button>
                  )}
                  
                  <button className={`${styles.iconBtn} ${styles.playBtn}`} onClick={() => handlePlayVoice(item.id)}>
                    {playingId === item.id ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                </div>
                
                {hasVoice && (
                  <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => deleteVoice(item.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
