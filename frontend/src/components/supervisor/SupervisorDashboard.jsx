import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  RefreshCw,
  Pill,
  Droplet,
  Mic,
  Square,
  Volume2,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Calendar,
  Check,
  Plus,
  Trash2,
  Utensils,
  Activity,
  Footprints,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMedications } from '../../hooks/useMedications';
import { useMetrics } from '../../hooks/useMetrics';
import useMedicationsStore from '../../store/medicationsStore';
import useRoleModeStore from '../../store/roleModeStore';
import RoleCircleSwitcher from '../common/RoleCircleSwitcher';
import {
  getMedicationDayProgress,
  recordMedicationIntake,
  calculateAdherenceStats,
  getNextAlarmPayloadForToday,
} from '../../store/medicationAdherenceStore';
import { triggerFamilyAlarm } from '../common/FamilyAlarmModal';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { getSavedDrugVisual, fetchAndCacheDrugVisual } from '../../utils/drugVisuals';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../../constants/metrics';
import { getGlucoseUnit, formatGlucose } from '../../utils/glucoseUnit';
import { useT } from '../../hooks/useT';
import Modal from '../common/Modal';
import FamilyCard from '../settings/FamilyCard';
import TelegramCard from '../settings/TelegramCard';
import styles from './SupervisorDashboard.module.css';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const t = useT();
  const { medications, todayMedications, fetchToday, fetchMedications } = useMedications();
  const { metrics, fetchMetrics } = useMetrics();
  const medicationStatus = useMedicationsStore((s) => s.medicationStatus);
  const statusVersion = useMedicationsStore((s) => s.statusVersion);

  const deviceMode = useRoleModeStore((s) => s.deviceMode);
  const setDeviceMode = useRoleModeStore((s) => s.setDeviceMode);
  const switchRole = useRoleModeStore((s) => s.switchRole);
  const openRoleSelector = useRoleModeStore((s) => s.openRoleSelector);
  const caregiverData = useRoleModeStore((s) => s.caregiverData);
  const addCaregiverTask = useRoleModeStore((s) => s.addCaregiverTask);
  const removeCaregiverTask = useRoleModeStore((s) => s.removeCaregiverTask);
  const callerTitle = useRoleModeStore((s) => s.callerTitle);
  const setCallerTitle = useRoleModeStore((s) => s.setCallerTitle);
  const alertPrefs = useRoleModeStore((s) => s.alertPrefs);
  const updateAlertPrefs = useRoleModeStore((s) => s.updateAlertPrefs);

  const [callerInput, setCallerInput] = useState(callerTitle);
  const [savedCallerToast, setSavedCallerToast] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [hasCustomVoice, setHasCustomVoice] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [voiceToast, setVoiceToast] = useState(null);
  const [showZaloPreview, setShowZaloPreview] = useState(false);
  const [showWeekDetailModal, setShowWeekDetailModal] = useState(false);
  const [dismissedOverdueAlert, setDismissedOverdueAlert] = useState(false);
  const [visualsMap, setVisualsMap] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // State thêm nhiệm vụ cho hộ lý
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('12:00');
  const [newTaskCategory, setNewTaskCategory] = useState('meal');

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addCaregiverTask({
      title: newTaskTitle.trim(),
      time: newTaskTime || '12:00',
      category: newTaskCategory,
    });
    setNewTaskTitle('');
    setNewTaskTime('12:00');
    setShowAddTaskModal(false);
  };

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordIntervalRef = useRef(null);

  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    fetchToday();
    fetchMedications().catch(() => {});
    fetchMetrics(undefined, 30).catch(() => {});
    voiceAlertService.getAllSettings().then((data) => {
      setHasCustomVoice(Boolean(data?.[ALERT_TYPES.MED_ALL]?.audioBase64));
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);

    const handleSync = () => {
      setSyncTick((t) => t + 1);
      fetchToday();
      fetchMetrics(undefined, 30).catch(() => {});
    };
    window.addEventListener('medicationIntakeChanged', handleSync);
    window.addEventListener('caregiverDataChanged', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('medicationIntakeChanged', handleSync);
      window.removeEventListener('caregiverDataChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMeds = todayMedications?.length ? todayMedications : medications || [];

  useEffect(() => {
    let active = true;
    const initial = {};
    (activeMeds || []).forEach((m) => {
      if (m?.name) initial[m.name] = getSavedDrugVisual(m.name);
    });
    setVisualsMap(initial);

    (activeMeds || []).forEach((m) => {
      if (!m?.name) return;
      fetchAndCacheDrugVisual(m.name).then((res) => {
        if (active && res) {
          setVisualsMap((prev) => ({ ...prev, [m.name]: res }));
        }
      });
    });
    return () => {
      active = false;
    };
  }, [activeMeds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Danh sách toàn bộ các cử uống trong ngày hôm nay (đồng bộ 100% với màn hình Bố/Mẹ)
  const allTodaySlots = useMemo(() => {
    const items = [];
    (activeMeds || []).forEach((med) => {
      const progress = getMedicationDayProgress(med, currentTime);
      progress.slots.forEach((slot) => {
        items.push({
          id: `${med.id}_${slot.key}`,
          med,
          slot,
          progress,
        });
      });
    });
    items.sort((a, b) => (a.slot.minutes ?? 0) - (b.slot.minutes ?? 0));
    return items;
  }, [activeMeds, currentTime, medicationStatus, statusVersion, syncTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayStats = useMemo(
    () => calculateAdherenceStats(activeMeds, 1),
    [activeMeds, medicationStatus, statusVersion, syncTick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const weekStats = useMemo(
    () => calculateAdherenceStats(activeMeds, 7),
    [activeMeds, medicationStatus, statusVersion, syncTick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const lateItems = useMemo(
    () => allTodaySlots.filter((item) => item.slot.status === 'pending' && item.slot.isLate),
    [allTodaySlots]
  );

  // Chuẩn bị dữ liệu 7 ngày qua cho biểu đồ (từ 6 ngày trước -> hôm nay)
  const chartDays = useMemo(() => {
    const historyList = (weekStats?.history || []).slice().reverse();
    const todayYmd = new Date().toISOString().slice(0, 10);

    return historyList.map((dayItem, idx) => {
      const isToday = idx === historyList.length - 1 || dayItem.date === todayYmd;
      const d = new Date(dayItem.date);
      let dayName = isToday ? 'Nay' : d.getDay() === 0 ? 'CN' : `Thứ ${d.getDay() + 1}`;
      const score = dayItem.scheduled > 0 ? dayItem.score : null;

      return {
        ...dayItem,
        isToday,
        dayName,
        score,
      };
    });
  }, [weekStats]);

  const unit = getGlucoseUnit();
  const latestGlucose = (metrics || []).find((m) => m.measurement_type?.startsWith('glucose'));
  const latestGlucoseStatus =
    latestGlucose && getMetricStatus(latestGlucose.measurement_type, latestGlucose.value, user?.diagnosis);

  const handleSaveCallerTitle = () => {
    setCallerTitle(callerInput);
    setSavedCallerToast(true);
    setTimeout(() => setSavedCallerToast(false), 2500);
  };

  const handleToggleSlotStatus = (item) => {
    const isDone = item.slot.status === 'taken' || item.slot.status === 'skipped';
    if (isDone) {
      recordMedicationIntake(item.med, 'pending', new Date(), null, item.slot.key);
    } else {
      recordMedicationIntake(item.med, 'taken', new Date(), null, item.slot.key);
    }
  };

  const startRecordingVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await voiceAlertService.saveVoice(ALERT_TYPES.MED_ALL, blob);
        setHasCustomVoice(true);
        setVoiceToast('Đã lưu giọng nhắc của con! Chuông bên máy Bố/Mẹ đã đồng bộ.');
        setTimeout(() => setVoiceToast(null), 3200);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRecordSec(1);
      recordIntervalRef.current = setInterval(() => {
        setRecordSec((s) => {
          if (s >= 10) {
            stopRecordingVoice();
            return 10;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setVoiceToast('Vui lòng cấp quyền Micro trên trình duyệt để thu âm giọng nhắc.');
      setTimeout(() => setVoiceToast(null), 3200);
    }
  };

  const stopRecordingVoice = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handlePlaySampleVoice = () => {
    voiceAlertService.playAlert(
      ALERT_TYPES.MED_ALL,
      'Bố ơi, đến giờ uống thuốc cử sáng rồi ạ!'
    );
  };

  const handleTriggerRemoteAlarm = () => {
    const payload = getNextAlarmPayloadForToday(activeMeds);
    triggerFamilyAlarm({
      ...payload,
      callerName: callerTitle,
    });
  };

  const isPc = deviceMode === 'pc';

  const leftColumnContent = (
    <div className={styles.gridCol}>
      {/* Ảnh 3: Cảnh báo quá giờ kèm nút "✓ Đã nhắc" để ẩn thông báo */}
      {lateItems.length > 0 && !dismissedOverdueAlert && (
        <div className={styles.statusBannerUrgent}>
          <div className={styles.bannerMain}>
            <div className={styles.bannerIconWrap}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className={styles.bannerTitle}>
                Cảnh báo: Bố/Mẹ đang quá giờ {lateItems.length} cử thuốc chưa uống!
              </h2>
              <p className={styles.bannerSub}>
                Trễ:{' '}
                {lateItems
                  .map((x) => `${x.med.name} (${x.slot.periodLabel} ${x.slot.time})`)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.dismissAlertBtn}
            onClick={() => setDismissedOverdueAlert(true)}
            title="Bấm để đánh dấu đã nhắc và ẩn cảnh báo này"
          >
            <Check size={16} strokeWidth={2.5} /> Đã nhắc
          </button>
        </div>
      )}

      {/* Ảnh 2: Thẻ Điểm Tuân Thủ (7 Ngày Qua) Chuẩn Y Khoa */}
      <section className={styles.adherenceCard}>
        <div className={styles.adherenceTop}>
          <h3 className={styles.adherenceTitle}>Điểm tuân thủ (7 ngày qua)</h3>
          <span className={styles.streakPill}>
            {weekStats.streakDays || 6} ngày chuỗi đúng giờ
          </span>
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.scoreNumber}>{weekStats.score}%</span>
          <span className={styles.scoreBadge}>
            {weekStats.score < 80 ? 'Còn cử chưa uống' : 'Duy trì đều đặn'}
          </span>
        </div>

        <div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${Math.max(4, Math.min(100, weekStats.score))}%`,
                background:
                  weekStats.score >= 80
                    ? '#10b981'
                    : weekStats.score >= 60
                    ? '#38bdf8'
                    : '#ef4444',
              }}
            />
          </div>
          <div className={styles.progressLabels} style={{ marginTop: 6 }}>
            <span>
              Đã uống: <strong>{todayStats.totalTaken} / {todayStats.totalScheduled} cử</strong>
            </span>
            <span>Mục tiêu y khoa: &gt; 80%</span>
          </div>
        </div>

        {/* 7 cột biểu đồ ngày trong tuần */}
        <div className={styles.chartGrid}>
          {chartDays.map((cd, idx) => {
            const hasScore = cd.score !== null;
            const barHeight = hasScore
              ? Math.max(8, Math.round((cd.score / 100) * 48))
              : 6;

            const barColor = cd.isToday
              ? '#38bdf8'
              : !hasScore
              ? 'rgba(255,255,255,0.2)'
              : cd.score >= 80
              ? '#34d399'
              : '#f87171';

            return (
              <div
                key={cd.date || idx}
                className={styles.dayCol}
                onClick={() => setShowWeekDetailModal(true)}
                title={`Ngày ${cd.dateLabel}: ${hasScore ? `${cd.score}%` : 'Chưa có cữ'}`}
              >
                <span
                  className={`${styles.dayColScore} ${
                    cd.isToday ? styles.dayColScoreToday : ''
                  }`}
                >
                  {hasScore ? `${cd.score}%` : '-'}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      height: `${barHeight}px`,
                      background: barColor,
                    }}
                  />
                </div>
                <span
                  className={`${styles.dayName} ${cd.isToday ? styles.dayNameToday : ''}`}
                >
                  {cd.dayName}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.detailToggleBtn}
          onClick={() => setShowWeekDetailModal(true)}
        >
          <Calendar size={15} /> Chi Tiết 7 Ngày Qua
        </button>
      </section>

      {/* Ảnh 1 Fix: Khung tiến độ thấy 4 loại thuốc đầu tiên, cuộn xuống xem thêm, không bị rớt chữ trên mobile */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>
            <Pill size={18} color="#0284c7" />
            Tiến độ uống thuốc hôm nay ({todayStats.totalTaken}/{todayStats.totalScheduled} cử)
          </h3>
          <span className={styles.sectionBadge}>
            {allTodaySlots.length} cử hôm nay
          </span>
        </div>

        {allTodaySlots.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
            Chưa có đơn thuốc nào trong sổ tay hôm nay.
          </p>
        ) : (
          <>
            <div className={styles.slotsScrollContainer}>
              {allTodaySlots.map((item) => {
                const { med, slot } = item;
                const vis = visualsMap[med.name];
                const imgUrl = vis?.candidates?.[0] || vis?.imageUrl || null;

                let pillBg = '#f1f5f9';
                let pillColor = '#64748b';
                let pillLabel = `Chưa tới giờ (${slot.time})`;

                if (slot.status === 'taken') {
                  pillBg = '#dcfce7';
                  pillColor = '#15803d';
                  pillLabel = `Đã uống${slot.takenAt ? ` lúc ${slot.takenAt}` : ''}`;
                } else if (slot.status === 'skipped') {
                  pillBg = '#f1f5f9';
                  pillColor = '#475569';
                  pillLabel = 'Đã bỏ qua';
                } else if (slot.isLate) {
                  pillBg = '#fee2e2';
                  pillColor = '#b91c1c';
                  pillLabel = `Quá giờ (${slot.time})`;
                } else if (slot.isArrived) {
                  pillBg = '#dbeafe';
                  pillColor = '#1d4ed8';
                  pillLabel = `Đến giờ (${slot.time})`;
                }

                return (
                  <div key={item.id} className={styles.slotItem}>
                    <div className={styles.slotTopRow}>
                      <div className={styles.slotThumb}>
                        {imgUrl ? (
                          <img src={imgUrl} alt={med.name} />
                        ) : (
                          <Pill size={22} color="#0284c7" />
                        )}
                      </div>
                      <div className={styles.slotInfo}>
                        {/* Tên thuốc đầy đủ, không bao giờ bị cắt Nic... */}
                        <div className={styles.slotMedName}>
                          {med.name} {med.dosage ? `(${med.dosage})` : ''}
                        </div>
                        <div className={styles.slotMedSub}>
                          Cử {slot.periodLabel} lúc {slot.time}
                        </div>
                        {vis?.commonName && (
                          <div className={styles.slotMedUsage}>{vis.commonName}</div>
                        )}
                      </div>
                    </div>

                    <div className={styles.slotBottomRow}>
                      <span
                        className={styles.slotStatusPill}
                        style={{ background: pillBg, color: pillColor }}
                      >
                        {pillLabel}
                      </span>
                      <button
                        type="button"
                        className={styles.slotActionBtn}
                        onClick={() => handleToggleSlotStatus(item)}
                        title={
                          slot.status === 'taken'
                            ? 'Hoàn tác trạng thái cử này'
                            : 'Đánh dấu đã uống hộ Bố/Mẹ'
                        }
                      >
                        {slot.status === 'taken' ? (
                          <>
                            <RotateCcw size={13} /> Hoàn tác
                          </>
                        ) : (
                          'Đánh dấu hộ'
                        )}
                      </button>
                    </div>

                    {caregiverData?.checklistLogs?.[item.id]?.photoProof && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 700 }}>
                          Hộ lý ({caregiverData.nurseName}) đã cho uống lúc {caregiverData.checklistLogs[item.id].takenAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingPhoto(caregiverData.checklistLogs[item.id].photoProof)}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#0284c7',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            padding: '3px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          Xem ảnh xác nhận
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allTodaySlots.length > 4 && (
              <p className={styles.scrollMoreHint}>
                Cuộn danh sách để xem thêm {allTodaySlots.length - 4} cử khác
              </p>
            )}
          </>
        )}
      </section>

      {/* Cấu hình Cảnh báo Tự động Zalo / Telegram cho Con (Chuyển sang bên trái cho 2 cột cân bằng) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>
            <MessageSquare size={18} color="#059669" />
            Cấu hình Báo tin Tự động về Máy Con
          </h3>
          <span className={styles.sectionBadge}>Zalo ZNS & Telegram</span>
        </div>

        <div>
          <div className={styles.switchItem}>
            <div className={styles.switchInfo}>
              <p className={styles.switchTitle}>Báo khẩn khi Bố/Mẹ quá giờ uống thuốc</p>
              <p className={styles.switchDesc}>
                Tự động nhắn tin cho con nếu quá giờ 30 phút hoặc sau 2 lần chuông nhắc chưa uống
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={alertPrefs.urgentMissedDose}
                onChange={(e) => updateAlertPrefs({ urgentMissedDose: e.target.checked })}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div className={styles.switchItem}>
            <div className={styles.switchInfo}>
              <p className={styles.switchTitle}>Bản tin An tâm 20:00 mỗi tối</p>
              <p className={styles.switchDesc}>
                Tổng kết cuối ngày: Bố/Mẹ đã uống đủ bao nhiêu cử và chỉ số đường huyết
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={alertPrefs.eveningDigest}
                onChange={(e) => updateAlertPrefs({ eveningDigest: e.target.checked })}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div className={styles.switchItem}>
            <div className={styles.switchInfo}>
              <p className={styles.switchTitle}>Cảnh báo tức thì Đường huyết bất thường</p>
              <p className={styles.switchDesc}>
                Báo ngay khi đường huyết hạ thấp (&lt; 3.9 mmol/L) hoặc tăng cao (&gt; 10.0 mmol/L)
              </p>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={alertPrefs.highLowGlucose}
                onChange={(e) => updateAlertPrefs({ highLowGlucose: e.target.checked })}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </div>

        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => setShowZaloPreview(true)}
        >
          <MessageSquare size={16} /> Xem thử tin nhắn Zalo / Telegram báo về máy con
        </button>
      </section>
    </div>
  );

  // Thẻ Theo Dõi & Giao Nhiệm Vụ Cho Hộ Lý (Cô Lan)
  const cleanNurseName =
    caregiverData?.nurseName
      ?.replace(/\s*\([^)]*Hộ\s*lý[^)]*\)/gi, '')
      ?.replace(/\s*Hộ\s*lý/gi, '')
      ?.trim() || 'Cô Lan';

  const caregiverSection = (
    <section className={styles.sectionCard} style={{ borderLeft: '4px solid #f59e0b' }}>
      <div className={styles.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <h3 className={styles.sectionTitle} style={{ fontSize: 14 }}>
            Nhiệm Vụ Ca Trực Của Hộ Lý ({cleanNurseName})
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowAddTaskModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11.5,
            fontWeight: 800,
            color: '#d97706',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            padding: '4px 10px',
            borderRadius: 8,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Plus size={13} strokeWidth={2.5} /> + Giao việc
        </button>
      </div>

      {/* Tiến độ hoàn thành nhiệm vụ theo ngày */}
      {(() => {
        const tasks = caregiverData?.dailyTasks || [];
        const done = tasks.filter((t) => t.completed).length;
        const total = tasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>
                Tiến độ ca trực: <strong style={{ color: '#0f172a' }}>{done}/{total} việc</strong>
              </span>
              <span style={{ color: done === total ? '#16a34a' : '#d97706', fontWeight: 800 }}>
                {pct}% đã xong
              </span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #10b981)', borderRadius: 999 }} />
            </div>

            {/* Danh sách nhiệm vụ con cháu theo dõi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: t.completed ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${t.completed ? '#bbf7d0' : '#e2e8f0'}`,
                    padding: '8px 10px',
                    borderRadius: 10,
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: t.completed ? '#dcfce7' : '#e2e8f0', color: t.completed ? '#15803d' : '#475569', flexShrink: 0 }}>
                      {t.category === 'medication' ? (
                        <Pill size={14} />
                      ) : t.category === 'meal' ? (
                        <Utensils size={14} />
                      ) : t.category === 'vital' ? (
                        <Activity size={14} />
                      ) : t.category === 'activity' ? (
                        <Footprints size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.completed ? '#166534' : '#0f172a', textDecoration: t.completed ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                          {t.title}
                        </span>
                        {t.time && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {t.time}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: t.completed ? '#15803d' : '#64748b', fontWeight: 600 }}>
                        {t.completed ? `✓ Hộ lý đã làm lúc ${t.completedAt || 'hôm nay'}` : '○ Hộ lý chưa thực hiện'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCaregiverTask(t.id)}
                    title="Xóa nhiệm vụ này"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Báo cáo ghi chép ca trực */}
      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
            Ghi chép & Lời nhắn ca trực:
          </span>
          <span style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>
            {caregiverData?.dailyNote?.lastUpdated ? `Cập nhật lúc ${caregiverData.dailyNote.lastUpdated}` : 'Hôm nay'}
          </span>
        </div>

        {caregiverData?.dailyNote?.meals && (
          <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: '8px 10px', borderRadius: 10 }}>
            <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 68 }}>Bữa ăn:</span>
            <span>{caregiverData.dailyNote.meals}</span>
          </div>
        )}
        {caregiverData?.dailyNote?.mood && (
          <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: '8px 10px', borderRadius: 10 }}>
            <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 68 }}>Tinh thần:</span>
            <span>{caregiverData.dailyNote.mood}</span>
          </div>
        )}
        {caregiverData?.dailyNote?.sleep && (
          <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: '8px 10px', borderRadius: 10 }}>
            <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 68 }}>Giấc ngủ:</span>
            <span>{caregiverData.dailyNote.sleep}</span>
          </div>
        )}
        {caregiverData?.dailyNote?.generalNotes && (
          <div style={{ display: 'flex', gap: 6, background: '#fffbeb', padding: '8px 10px', borderRadius: 10, color: '#92400e', border: '1px solid #fef3c7' }}>
            <span style={{ fontWeight: 700, minWidth: 68 }}>Lời nhắn:</span>
            <span>{caregiverData.dailyNote.generalNotes}</span>
          </div>
        )}
      </div>
    </section>
  );

  const rightColumnContent = (
    <div className={styles.gridCol}>
      {/* Đường huyết mới nhất */}
      <div className={styles.glucoseBox}>
        <div>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Droplet size={15} color="#dc2626" /> Đường huyết mới nhất của Bố/Mẹ
          </span>
          {latestGlucose ? (
            <div
              className={styles.glucoseValue}
              style={{ color: STATUS_COLORS[latestGlucoseStatus] || '#0f172a', marginTop: 4 }}
            >
              {formatGlucose(latestGlucose.value, unit)}{' '}
              <small style={{ fontSize: 14, fontWeight: 700 }}>
                {unit} · {getStatusLabel(latestGlucoseStatus, t, latestGlucose.measurement_type)}
              </small>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
              Hôm nay Bố/Mẹ chưa đo đường huyết
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#0284c7',
            background: '#e0f2fe',
            padding: '4px 10px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {latestGlucose?.measurement_time ? `Đo lúc ${latestGlucose.measurement_time}` : 'Tự động đồng bộ'}
        </span>
      </div>

      {/* Ở chế độ PC: Thẻ Nhiệm vụ & Ghi chép Hộ lý chuyển sang bên phải để 2 cột cân đối */}
      {caregiverSection}

      {/* Phòng điều khiển Chuông gọi Gia đình & Thu âm giọng con từ xa */}
      <section className={styles.voiceBox}>
        <div className={styles.voiceHead}>
          <h3 className={styles.voiceTitle}>
            Điều khiển Chuông Con Cháu Nhắc Thuốc Bố/Mẹ
          </h3>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(16,185,129,0.25)',
              color: '#a7f3d0',
            }}
          >
            {hasCustomVoice ? 'Đã có giọng thu âm' : 'Giọng đọc tự động'}
          </span>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#a7f3d0',
              marginBottom: 5,
            }}
          >
            Tên người thân hiển thị trên màn hình báo thức của Bố/Mẹ:
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className={styles.callerInput}
              value={callerInput}
              onChange={(e) => setCallerInput(e.target.value)}
              placeholder="VD: Con gái Trinh nhắc bố uống thuốc"
            />
            <button
              type="button"
              onClick={handleSaveCallerTitle}
              style={{
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {savedCallerToast ? '✓ Đã lưu' : 'Lưu tên'}
            </button>
          </div>
        </div>

        <div className={styles.voiceActionsRow}>
          {!recording ? (
            <button
              type="button"
              className={`${styles.voiceBtn} ${styles.voiceRecordBtn}`}
              onClick={startRecordingVoice}
            >
              <Mic size={15} /> Thu âm giọng con (5-10s)
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.voiceBtn} ${styles.voiceRecordBtn}`}
              onClick={stopRecordingVoice}
            >
              <Square size={15} /> Dừng thu ({recordSec}s/10s)
            </button>
          )}

          <button
            type="button"
            className={`${styles.voiceBtn} ${styles.voicePlayBtn}`}
            onClick={handlePlaySampleVoice}
          >
            <Volume2 size={15} /> Nghe thử giọng nhắc
          </button>

          <button
            type="button"
            className={`${styles.voiceBtn} ${styles.voiceAlarmBtn}`}
            onClick={handleTriggerRemoteAlarm}
          >
            <BellRing size={15} /> Thử chuông sang máy Bố
          </button>
        </div>

        {voiceToast && (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#fde047',
              background: 'rgba(0,0,0,0.28)',
              padding: '6px 10px',
              borderRadius: 8,
            }}
          >
            {voiceToast}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Thanh Điều Khiển: Chuyển PC/Mobile + Xoay về Màn hình Bố/Mẹ */}
      <header className={styles.topControlBar}>
        <div className={styles.titleArea}>
          <div className={styles.badgeRow}>
            <span className={styles.roleBadge}>
              <ShieldCheck size={14} /> NGƯỜI GIÁM SÁT
            </span>
            <span className={styles.liveDot}>
              <span className={styles.pulseCircle} /> Tự động đồng bộ
            </span>
          </div>
          <h1 className={styles.patientName}>
            Người giám hộ: {user?.name || 'Khôi Lê'}
          </h1>
        </div>

        <div className={styles.switchersArea}>
          {/* Nút chuyển đổi khung hình PC hoặc Mobile */}
          <div className={styles.devicePill} role="group" aria-label="Chuyển chế độ hiển thị PC hoặc Điện thoại">
            <button
              type="button"
              className={`${styles.deviceBtn} ${deviceMode === 'mobile' ? styles.deviceBtnActive : ''}`}
              onClick={() => setDeviceMode('mobile')}
              title="Thu nhỏ màn hình giống điện thoại"
            >
              <Smartphone size={14} /> Mobile
            </button>
            <button
              type="button"
              className={`${styles.deviceBtn} ${deviceMode === 'pc' ? styles.deviceBtnActive : ''}`}
              onClick={() => setDeviceMode('pc')}
              title="Mở rộng toàn màn hình PC 2 cột"
            >
              <Monitor size={14} /> PC
            </button>
          </div>

          {/* Vòng tròn đổi vai trò */}
          <RoleCircleSwitcher />
        </div>
      </header>

      {isPc ? (
        <div className={styles.gridPc}>
          {leftColumnContent}
          {rightColumnContent}
        </div>
      ) : (
        <>
          {leftColumnContent}
          {rightColumnContent}
        </>
      )}

      {/* Modal Chi Tiết 7 Ngày Qua */}
      {showWeekDetailModal && (
        <Modal
          title="Lịch Sử Tuân Thủ Thuốc 7 Ngày Qua"
          onClose={() => setShowWeekDetailModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chartDays.map((day) => (
              <div
                key={day.date}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong>
                    {day.dateLabel} {day.isToday ? '(Hôm nay)' : ''}
                  </strong>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: day.score >= 80 ? '#15803d' : day.score != null ? '#b91c1c' : '#64748b',
                    }}
                  >
                    {day.score != null ? `${day.score}% (${day.taken}/${day.scheduled} cử)` : 'Nghỉ cữ'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  {day.medications?.map((m) => (
                    <div key={m.medicationId} style={{ marginTop: 3 }}>
                      • {m.name}: <strong>{m.takenSummary}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowWeekDetailModal(false)}
              style={{
                padding: '10px',
                borderRadius: 12,
                border: 'none',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Mô Phỏng Tin Nhắn Zalo / Telegram */}
      {showZaloPreview && (
        <Modal
          title="Mô phỏng Tin nhắn Báo về Máy Con (Zalo / Telegram)"
          onClose={() => setShowZaloPreview(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className={styles.zaloBubble}>
              <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: 6 }}>
                TRỢ LÝ GIA ĐÌNH DIA+ · CẬP NHẬT TỨC THÌ
              </div>
              <div>
                <strong>Người thân:</strong> {user?.name || 'Bố/Mẹ'}
              </div>
              <div>
                <strong>Tiến độ uống thuốc hôm nay:</strong> Đã uống{' '}
                <strong>
                  {todayStats.totalTaken}/{todayStats.totalScheduled} cử ({todayStats.score}%)
                </strong>
              </div>
              {lateItems.length > 0 ? (
                <div style={{ color: '#b91c1c', fontWeight: 700, marginTop: 6 }}>
                  Cảnh báo quá giờ:{' '}
                  {lateItems
                    .map((x) => `${x.med.name} (${x.slot.periodLabel} ${x.slot.time})`)
                    .join(', ')}
                  . Con hãy nhắc Bố/Mẹ nhé!
                </div>
              ) : (
                <div style={{ color: '#15803d', fontWeight: 700, marginTop: 6 }}>
                  Tất cả các cử tới giờ hôm nay đều đã được Bố/Mẹ uống đúng lịch.
                </div>
              )}
              {latestGlucose && (
                <div style={{ marginTop: 6 }}>
                  <strong>Đường huyết gần nhất:</strong>{' '}
                  {formatGlucose(latestGlucose.value, unit)} {unit} (
                  {getStatusLabel(latestGlucoseStatus, t, latestGlucose.measurement_type)})
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowZaloPreview(false)}
              style={{
                padding: '11px',
                borderRadius: 12,
                border: 'none',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đã hiểu
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Xem Ảnh Xác Nhận Uống Thuốc Từ Hộ Lý */}
      {viewingPhoto && (
        <Modal
          isOpen={Boolean(viewingPhoto)}
          onClose={() => setViewingPhoto(null)}
          title="Ảnh Xác Nhận Từ Hộ Lý"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <img
              src={viewingPhoto}
              alt="Bằng chứng hộ lý chụp"
              style={{
                width: '100%',
                maxHeight: '360px',
                objectFit: 'contain',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#000',
              }}
            />
            <p style={{ margin: 0, fontSize: 13, color: '#475569', textAlign: 'center', fontWeight: 600 }}>
              Ảnh chụp khay thuốc / quá trình cho cụ uống thuốc bởi Hộ lý ({caregiverData?.nurseName || 'Cô Lan'})
            </p>
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
              style={{
                padding: '11px',
                borderRadius: 12,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Con Cháu Thêm Nhiệm Vụ Giao Cho Hộ Lý */}
      {showAddTaskModal && (
        <Modal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          title="Giao Nhiệm Vụ Cho Hộ Lý"
        >
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Tên nhiệm vụ cần giao:
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="VD: Cho cụ ăn yến chưng, Nhắc uống nước ấm..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Giờ thực hiện:
                </label>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Phân loại:
                </label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: '#fff',
                  }}
                >
                  <option value="meal">Bữa ăn</option>
                  <option value="medication">Thuốc</option>
                  <option value="vital">Đo chỉ số sức khỏe</option>
                  <option value="activity">Vận động</option>
                  <option value="custom">Nhiệm vụ khác</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#d97706',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Giao việc ngay
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
