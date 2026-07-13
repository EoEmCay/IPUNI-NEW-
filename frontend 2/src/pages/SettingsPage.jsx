import React, { useState, useEffect, useRef } from 'react';
import { Settings, Mic, Square, Play, Trash2, HeartPulse, Activity, ZoomIn, Crown, Sparkles, Bell, Shield, HelpCircle } from 'lucide-react';
import { voiceAlertService, ALERT_TYPES } from '../services/voiceAlert.service';
import useThemeStore from '../store/themeStore';
import useAccessibilityStore from '../store/accessibilityStore';
import { useT } from '../hooks/useT';
import styles from './SettingsPage.module.css';

const ALERT_CONFIG = [
  {
    id: ALERT_TYPES.MED_ALL,
    title: 'Nhắc uống thuốc',
    desc: 'Phát khi đến giờ uống thuốc (tự động đọc tên thuốc)',
    icon: <Settings size={18} />
  },
  {
    id: ALERT_TYPES.SUGAR_HIGH,
    title: 'Cảnh báo đường huyết TĂNG',
    desc: 'Phát khi đường huyết sát ngưỡng nguy hiểm',
    icon: <Activity size={18} />
  },
  {
    id: ALERT_TYPES.SUGAR_LOW,
    title: 'Cảnh báo đường huyết GIẢM',
    desc: 'Phát khi đường huyết quá thấp',
    icon: <Activity size={18} />
  },
  {
    id: ALERT_TYPES.BP_LOW,
    title: 'Cảnh báo tụt huyết áp',
    desc: 'Phát khi huyết áp thấp, nhắc nhở bình tĩnh',
    icon: <HeartPulse size={18} />
  }
];

export default function SettingsPage() {
  const { isCuteMode, toggleCuteMode, isGoldMode } = useThemeStore();
  const { fontScale, setFontScale } = useAccessibilityStore();
  const t = useT();
  const s = t.settings;

  const [settings, setSettings] = useState({});
  const [recordingId, setRecordingId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await voiceAlertService.getAllSettings();
    setSettings(data);
  };

  const startRecording = async (alertType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await voiceAlertService.saveVoice(alertType, audioBlob);
        loadSettings();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingId(alertType);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Không thể truy cập Micro. Vui lòng cấp quyền trong cài đặt trình duyệt.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingId(null);
  };

  const playVoice = (alertType) => {
    voiceAlertService.playAlert(alertType);
  };

  const deleteVoice = async (alertType) => {
    if (window.confirm("Bạn có chắc muốn xóa giọng nói này?")) {
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
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Settings size={24} />
          <h1>Cài đặt giọng nói</h1>
        </div>
        <p>Ghi âm giọng nói của người nhà để tạo sự thân thuộc khi ứng dụng nhắc nhở</p>
      </div>

      <div className={`${styles.alertList} tour-step-8`}>
        {ALERT_CONFIG.map((item) => {
          const setting = settings[item.id] || {};
          const hasVoice = !!setting.audioBase64;
          const useCustom = hasVoice && setting.useCustomVoice !== false;
          const isRecording = recordingId === item.id;

          return (
            <div key={item.id} className={styles.alertCard}>
              <div className={styles.alertHeader}>
                <h3 className={styles.alertTitle}>{item.title}</h3>
                {hasVoice && (
                  <div className={styles.toggleGroup}>
                    <span>Dùng giọng người nhà</span>
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
              <p className={styles.alertDesc}>{item.desc}</p>
              
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
                  
                  <button className={`${styles.iconBtn} ${styles.playBtn}`} onClick={() => playVoice(item.id)}>
                    <Play size={20} fill="currentColor" />
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

      <div className={styles.divider} style={{ margin: '30px 0', borderBottom: '1px solid #E2E8F0' }} />

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Settings size={24} />
          <h1>{s.title || 'Cài đặt chung'}</h1>
        </div>
        <p>Tùy chỉnh trải nghiệm của bạn</p>
      </div>

      <div className={styles.settingsGroup} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <p className={styles.sectionLabel} style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748B', marginBottom: '16px', textTransform: 'uppercase' }}>
          {s.sectionDisplay || 'Hiển thị'}
        </p>
        <div className={styles.row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className={styles.rowLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.iconWrap} style={{ background: '#EFF6FF', padding: '8px', borderRadius: '12px' }}>
              <ZoomIn size={18} color="#1B5FA6" />
            </div>
            <div>
              <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.fontSizeTitle || 'Cỡ chữ (Phóng to)'}</p>
              <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.fontSizeDesc || 'Phóng to toàn bộ chữ để dễ đọc hơn'}</p>
            </div>
          </div>
        </div>
        <div className={styles.scaleRow} style={{ display: 'flex', gap: '8px' }}>
          {[1, 1.25, 1.5, 2].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFontScale(lvl)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '10px', fontWeight: 600,
                border: fontScale === lvl ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                background: fontScale === lvl ? '#EFF6FF' : 'white',
                color: fontScale === lvl ? '#1B5FA6' : '#64748B',
                cursor: 'pointer'
              }}
              aria-label={`Phóng to ${lvl}x`}
            >
              {lvl}x
            </button>
          ))}
        </div>

        <div className={styles.divider} style={{ margin: '24px 0', borderBottom: '1px solid #F1F5F9' }} />

        <p className={styles.sectionLabel} style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748B', marginBottom: '16px', textTransform: 'uppercase' }}>
          {s.sectionTheme || 'Giao diện'}
        </p>
        {isGoldMode ? (
          <div className={styles.goldThemeRow} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.goldThemeIcon} style={{ background: '#FEF3C7', padding: '8px', borderRadius: '12px' }}>
              <Crown size={18} fill="#C9921A" color="#C9921A" />
            </div>
            <div>
              <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.goldTheme}</p>
              <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.goldThemeDesc}</p>
            </div>
          </div>
        ) : (
          <div className={styles.row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className={styles.rowLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={styles.iconWrap} style={{ background: isCuteMode ? '#F5F0FF' : '#FEF3C7', padding: '8px', borderRadius: '12px' }}>
                <Sparkles size={18} color={isCuteMode ? '#A855F7' : '#D97706'} />
              </div>
              <div>
                <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.cuteMode}</p>
                <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.cuteModeDesc}</p>
              </div>
            </div>
            <button
              onClick={toggleCuteMode}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                background: isCuteMode ? '#A855F7' : '#E2E8F0',
                position: 'relative', border: 'none', cursor: 'pointer',
                transition: '0.3s'
              }}
              aria-label="Toggle Cute Mode"
            >
              <span style={{
                display: 'block', width: '20px', height: '20px', borderRadius: '50%',
                background: 'white', position: 'absolute', top: '2px',
                left: isCuteMode ? '22px' : '2px', transition: '0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </button>
          </div>
        )}

        <div className={styles.divider} style={{ margin: '24px 0', borderBottom: '1px solid #F1F5F9' }} />

        <p className={styles.sectionLabel} style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748B', marginBottom: '16px', textTransform: 'uppercase' }}>
          {s.sectionNotify || 'Thông báo'}
        </p>
        <div className={styles.row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={styles.rowLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.iconWrap} style={{ background: '#EFF6FF', padding: '8px', borderRadius: '12px' }}>
              <Bell size={18} color="#1B5FA6" />
            </div>
            <div>
              <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.reminderTitle}</p>
              <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.reminderDesc}</p>
            </div>
          </div>
          <div style={{ fontSize: '12px', background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '8px' }}>{s.comingSoon}</div>
        </div>

        <div className={styles.divider} style={{ margin: '24px 0', borderBottom: '1px solid #F1F5F9' }} />

        <p className={styles.sectionLabel} style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748B', marginBottom: '16px', textTransform: 'uppercase' }}>
          {s.sectionOther || 'Khác'}
        </p>
        <div className={styles.row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className={styles.rowLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.iconWrap} style={{ background: '#F0FDF4', padding: '8px', borderRadius: '12px' }}>
              <Shield size={18} color="#16A34A" />
            </div>
            <div>
              <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.privacy}</p>
              <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.privacyDesc}</p>
            </div>
          </div>
          <div style={{ fontSize: '12px', background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '8px' }}>{s.comingSoon}</div>
        </div>

        <div className={styles.row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={styles.rowLeft} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.iconWrap} style={{ background: '#F8F8F8', padding: '8px', borderRadius: '12px' }}>
              <HelpCircle size={18} color="#6B7A8D" />
            </div>
            <div>
              <p className={styles.rowTitle} style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', margin: 0 }}>{s.support}</p>
              <p className={styles.rowDesc} style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{s.supportDesc}</p>
            </div>
          </div>
          <div style={{ fontSize: '12px', background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '8px' }}>{s.comingSoon}</div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#94A3B8', fontSize: '12px' }}>{s.version}</p>
      </div>
    </div>
  );
}
