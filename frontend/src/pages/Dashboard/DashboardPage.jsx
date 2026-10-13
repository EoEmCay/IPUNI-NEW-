import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  CheckCircle2,
  Settings2,
  Droplet,
  ChevronRight,
  ScanText,
  PhoneCall,
  Plus,
  Minus,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { triggerFamilyAlarm } from '../../components/common/FamilyAlarmModal';
import { useAuth } from '../../hooks/useAuth';
import { useMedications } from '../../hooks/useMedications';
import useMedicationsStore from '../../store/medicationsStore';
import useRoleModeStore from '../../store/roleModeStore';
import SupervisorDashboard from '../../components/supervisor/SupervisorDashboard';
import CaregiverDashboard from '../../components/caregiver/CaregiverDashboard';
import {
  calculateAdherenceStats,
  getNextAlarmPayloadForToday,
} from '../../store/medicationAdherenceStore';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import MedicationHistoryModal from '../../components/medications/MedicationHistoryModal';
import SosSheet from '../../components/sos/SosSheet';
import Modal from '../../components/common/Modal';
import GlucoseQuickModal from '../../components/metrics/GlucoseQuickModal';
import { useMetrics } from '../../hooks/useMetrics';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../../constants/metrics';
import { getGlucoseUnit, formatGlucose } from '../../utils/glucoseUnit';
import { saveGlucoseReading } from '../../utils/glucoseReading';
import NotificationBell from '../../components/layout/NotificationBell';
import DayChip from '../../components/common/DayChip';
import RoleCircleSwitcher from '../../components/common/RoleCircleSwitcher';
import styles from './DashboardPage.module.css';

const BELL_CSS = { btn: styles.bellBtn, hasBadge: styles.bellHasBadge, active: styles.bellActive, badge: styles.bellBadge };

// Danh sách toàn bộ tiện ích:
// - Các tiện ích đã ra mắt (launched: true) mặc định nằm ở "Đã thêm vào" và hiển thị ngoài trang chủ.
// - Các tiện ích chưa ra mắt (launched: false) mặc định được đưa vào "Tùy chỉnh" (hàng trên: "Chưa thêm vào").
const ALL_UTILITIES = [
  { key: 'scan', label: 'Quét đơn AI', sub: 'Đọc đơn & ảnh thuốc', badge: 'MỚI', to: '/scan', launched: true },
  { key: 'schedule', label: 'Lịch uống thuốc', sub: 'Sổ tay & giờ cử', to: '/medications', launched: true },
  { key: 'adherence', label: 'Mức tuân thủ', sub: 'Tỷ lệ đúng giờ', modal: true, launched: true },
  { key: 'diary', label: 'Sổ sức khỏe', sub: 'Đường huyết & HA', to: '/glucose', launched: true },
  { key: 'nutrition', label: 'Dinh dưỡng', sub: 'Thực đơn GI thấp', to: '/advice', launched: true },
  { key: 'sos', label: 'Cảnh báo SOS', sub: 'Gọi cấp cứu nhanh', launched: true },
  { key: 'booking', label: 'Hẹn bác sĩ', sub: 'Lịch tái khám', badge: 'SẮP RA', launched: false },
  { key: 'cgm', label: 'Kết nối CGM', sub: 'Cảm biến 24/7', badge: 'SẮP RA', launched: false },
];

const DEFAULT_ADDED_KEYS = ALL_UTILITIES.filter((u) => u.launched).map((u) => u.key);
const CUSTOM_UTILS_STORAGE_KEY = 'diaplus_custom_utilities_v1';

function loadAddedUtilityKeys() {
  try {
    const raw = localStorage.getItem(CUSTOM_UTILS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADDED_KEYS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ADDED_KEYS;
    const validKeys = parsed.filter((k) => ALL_UTILITIES.some((u) => u.key === k));
    return validKeys.length > 0 ? validKeys : DEFAULT_ADDED_KEYS;
  } catch {
    return DEFAULT_ADDED_KEYS;
  }
}

// Hình bác sĩ + người bệnh ở banner (vẽ lại từ bản thiết kế).
function DoctorPatientArt() {
  return (
    <svg className={styles.bannerArt} viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <rect fill="#0284c7" fillOpacity="0.9" height="52" rx="10" width="46" x="90" y="80" />
      <rect fill="#38bdf8" height="35" rx="8" width="38" x="94" y="60" />
      <circle cx="112" cy="46" fill="#fbd5bb" r="14" />
      <path d="M102 38 Q112 30 122 38 Q124 35 120 32 Q112 28 102 33 Z" fill="#e2e8f0" />
      <rect fill="none" height="4" rx="1.5" stroke="#475569" strokeWidth="1.2" width="6" x="105" y="44" />
      <rect fill="none" height="4" rx="1.5" stroke="#475569" strokeWidth="1.2" width="6" x="113" y="44" />
      <line stroke="#475569" strokeWidth="1.2" x1="111" x2="113" y1="46" y2="46" />
      <path d="M98 62 C98 56 126 56 126 62 L128 92 L96 92 Z" fill="#93c5fd" />
      <circle cx="48" cy="44" fill="#fbd5bb" r="14" />
      <path d="M38 41 C38 31 58 31 58 41 C55 35 41 35 38 41 Z" fill="#334155" />
      <path d="M34 60 C34 54 62 54 62 60 L65 110 L31 110 Z" fill="#ffffff" />
      <path d="M42 58 L48 76 L54 58" fill="none" stroke="#0284c7" strokeWidth="2.5" />
      <rect fill="#60a5fa" height="30" rx="3" width="22" x="52" y="68" />
      <rect fill="#ffffff" height="2" rx="1" width="16" x="55" y="73" />
      <rect fill="#ffffff" height="2" rx="1" width="12" x="55" y="78" />
      <rect fill="#ffffff" height="2" rx="1" width="14" x="55" y="83" />
      <circle cx="80" cy="55" fill="#38bdf8" opacity="0.6" r="3" />
    </svg>
  );
}

// Trang chủ (giao diện mới 10/2026): header riêng, banner, lưới tiện ích; bên dưới vẫn giữ
// "Thuốc hôm nay" (nút Tôi đã uống - nhật ký uống thuốc là nguồn để báo người nhà) + đường huyết.
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { medications, todayMedications, fetchToday, fetchMedications } = useMedications();
  const [showAdherence, setShowAdherence] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showMeds, setShowMeds] = useState(false);
  const [showGlucose, setShowGlucose] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [addedKeys, setAddedKeys] = useState(() => loadAddedUtilityKeys());
  const { metrics, fetchMetrics, addMetric } = useMetrics();
  const unit = getGlucoseUnit();
  const loadGlucose = () => fetchMetrics(undefined, 30);
  useEffect(() => { loadGlucose(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const latest = (metrics || []).find((m) => m.measurement_type?.startsWith('glucose'));
  const latestStatus = latest && getMetricStatus(latest.measurement_type, latest.value, user?.diagnosis);
  const saveGlucose = async (data) => { await saveGlucoseReading(addMetric, data, user?.diagnosis); await loadGlucose(); };
  const medicationStatus = useMedicationsStore((s) => s.medicationStatus);
  const statusVersion = useMedicationsStore((s) => s.statusVersion);
  const t = useT();
  const [soon, setSoon] = useState(null);
  const [slide, setSlide] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  useEffect(() => {
    if (!soon) return undefined;
    const timer = setTimeout(() => setSoon(null), 2200);
    return () => clearTimeout(timer);
  }, [soon]);

  const updateAddedKeys = (nextKeys) => {
    setAddedKeys(nextKeys);
    try {
      localStorage.setItem(CUSTOM_UTILS_STORAGE_KEY, JSON.stringify(nextKeys));
    } catch {
      /* ignore */
    }
  };

  const handleAddUtility = (key) => {
    if (addedKeys.includes(key)) return;
    updateAddedKeys([...addedKeys, key]);
  };

  const handleRemoveUtility = (key) => {
    if (addedKeys.length <= 1) {
      setSoon('Cần giữ ít nhất 1 tiện ích');
      return;
    }
    updateAddedKeys(addedKeys.filter((k) => k !== key));
  };

  const handleResetUtilities = () => {
    updateAddedKeys(DEFAULT_ADDED_KEYS);
  };

  const addedUtilities = useMemo(
    () => addedKeys.map((k) => ALL_UTILITIES.find((u) => u.key === k)).filter(Boolean),
    [addedKeys]
  );

  const unaddedUtilities = useMemo(
    () => ALL_UTILITIES.filter((u) => !addedKeys.includes(u.key)),
    [addedKeys]
  );

  const today = useMemo(
    () => calculateAdherenceStats(todayMedications, 1),
    [todayMedications, medicationStatus, statusVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const allDone = today.totalScheduled > 0 && today.totalTaken >= today.totalScheduled;

  const open = (item) => {
    if (item.to) return navigate(item.to);
    if (item.key === 'sos') return setShowSos(true);
    if (item.modal) { fetchMedications().catch(() => {}); return setShowAdherence(true); }
    return setSoon(`${item.label} sắp ra mắt`);
  };

  const onCarouselScroll = (e) => {
    const el = e.currentTarget;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goSlide = (i) => {
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const roleMode = useRoleModeStore((s) => s.roleMode);
  const switchRole = useRoleModeStore((s) => s.switchRole);
  const openRoleSelector = useRoleModeStore((s) => s.openRoleSelector);

  if (roleMode === 'supervisor') {
    return <SupervisorDashboard />;
  }

  if (roleMode === 'caregiver') {
    return <CaregiverDashboard />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div
          className={styles.topRow}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <DayChip />
          <RoleCircleSwitcher />
        </div>

        <div className={styles.greetRow}>
          <button type="button" className={styles.avatar} onClick={() => navigate('/profile')} aria-label="Hồ sơ của tôi">
            <img src="/avatar-logo.jpg" alt="" className={styles.avatarImg} width="56" height="56" />
            <span className={styles.avatarDot} />
          </button>
          <div className={styles.greetText}>
            <p className={styles.hello}>Chào ông/bà,</p>
            <h1 className={styles.userName}>{user?.name || 'Bạn'}</h1>
          </div>
          <NotificationBell css={BELL_CSS} />
        </div>
      </header>

      <section aria-label="Giới thiệu DIA+">
        <div className={styles.carousel} ref={carouselRef} onScroll={onCarouselScroll}>
          <div className={styles.banner}>
            <div className={styles.bannerText}>
              <span className={styles.bannerBrand}>DIA+</span>
              <p className={styles.bannerTag}>Đồng hành cùng gia đình</p>
              <h2 className={styles.bannerTitle}>ĐO LƯỜNG CHỈ SỐ SỨC KHỎE<span>PHÂN TÍCH ĐƠN THUỐC</span></h2>
              <a className={styles.bannerLink} href="https://diaplus.vn" target="_blank" rel="noreferrer">DIAPLUS.VN</a>
            </div>
            <DoctorPatientArt />
          </div>
          <div className={styles.banner}>
            <div className={styles.bannerText}>
              <span className={styles.bannerBrand}>QUÉT AI</span>
              <p className={styles.bannerTag}>Chụp ảnh đơn thuốc</p>
              <h2 className={styles.bannerTitle}>APP TỰ ĐỌC TÊN THUỐC<span>LIỀU DÙNG & GIỜ UỐNG</span></h2>
              <button type="button" className={styles.bannerLink} onClick={() => navigate('/scan')}>Quét ngay</button>
            </div>
            <ScanText className={styles.bannerIcon} aria-hidden="true" />
          </div>
        </div>
        <div className={styles.dots}>
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${slide === i ? styles.dotActive : ''}`}
              onClick={() => goSlide(i)}
              aria-label={`Xem banner ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="utilities-title">
        <div className={styles.sectionHead}>
          <h2 id="utilities-title" className={styles.sectionTitle}>
            <span className={styles.gridIcon} aria-hidden="true"><i /><i /><i /><i /></span>
            Tiện ích y tế DIA+
          </h2>
          <button type="button" className={styles.customize} onClick={() => setShowCustomize(true)}>
            <Settings2 size={16} aria-hidden="true" /> Tùy chỉnh
          </button>
        </div>
        <div className={`${styles.grid} ${addedUtilities.length <= 6 && addedUtilities.length !== 4 ? styles.gridThree : ''}`}>
          {addedUtilities.map((item) => (
            <button key={item.key} type="button" className={`${styles.tile} tour-${item.key}`} onClick={() => open(item)}>
              {item.badge && (
                <span className={`${styles.badge} ${!item.launched ? styles.badgeSoon : item.badge === 'HOT' ? styles.badgeHot : ''}`}>
                  {item.badge}
                </span>
              )}
              <div className={`${styles.tileIconPod} ${styles['pod_' + item.key] || ''}`}>
                <img src={`/icons/tienich/${item.key}.png`} alt="" className={styles.tileImg} width="44" height="44" />
              </div>
              <span className={styles.tileLabel}>{item.label}</span>
              <span className={styles.tileSub}>{item.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Thuốc hôm nay + Đường huyết: 2 nút gọn. Bấm thuốc -> bảng có nút "Tôi đã uống" (nguồn nhật ký báo người nhà) */}
      <div className={styles.quickRow}>
        <button
          type="button"
          className={`${styles.quick} tour-meds`}
          onClick={() => (todayMedications.length ? setShowMeds(true) : navigate('/scan'))}
        >
          <span className={styles.quickHead}><Pill size={20} aria-hidden="true" /> {t.dashboard.todayMeds}</span>
          <span className={`${styles.quickValue} ${allDone ? styles.quickDone : ''}`}>
            {todayMedications.length === 0 ? 'Chưa có đơn'
              : today.totalScheduled === 0 ? `${todayMedications.length} thuốc`
                : allDone ? <><CheckCircle2 size={18} aria-hidden="true" /> Đã uống đủ</>
                  : (
                    <span className={styles.quickTakenWrap}>
                      <span className={styles.quickTakenPrefix}>Đã uống</span>
                      <strong className={styles.quickTakenFraction}>
                        {today.totalTaken}/{today.totalScheduled}
                      </strong>
                      <span className={styles.quickTakenSuffix}>cữ</span>
                    </span>
                  )}
          </span>
          <span className={styles.quickHint}>
            {todayMedications.length ? 'Bấm để đánh dấu' : 'Bấm để quét đơn'} <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>

        <button type="button" className={`${styles.quick} tour-glucose`} onClick={() => setShowGlucose(true)}>
          <span className={styles.quickHead}><Droplet size={20} aria-hidden="true" /> Đường huyết</span>
          {latest ? (
            <span className={styles.quickValue} style={{ color: STATUS_COLORS[latestStatus] }}>
              {formatGlucose(latest.value, unit)} <small className={styles.quickUnit}>{unit}</small>
            </span>
          ) : (
            <span className={styles.quickValue}>Chưa đo</span>
          )}
          <span className={styles.quickHint}>
            {latest ? getStatusLabel(latestStatus, t, latest.measurement_type) : 'Bấm để ghi số đo'} <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Nút trải nghiệm nhanh Chuông gọi nhắc thuốc của con cháu (Tầng 1) */}
      <button
        type="button"
        onClick={() =>
          triggerFamilyAlarm(
            getNextAlarmPayloadForToday(todayMedications.length ? todayMedications : medications)
          )
        }
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '13px 14px',
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(15, 118, 110, 0.25)',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PhoneCall size={20} />
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <strong
              style={{
                display: 'block',
                fontSize: '15.5px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Chuông con cháu nhắc uống thuốc
            </strong>
            <span
              style={{
                display: 'block',
                fontSize: '12.5px',
                opacity: 0.94,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Mở báo thức giọng nói gia đình (Tầng 1)
            </span>
          </span>
        </span>
        <ChevronRight size={20} style={{ flexShrink: 0 }} />
      </button>

      {/* Thông báo + các bảng gắn thẳng vào body: nằm ngoài vùng cuộn có zoom (cỡ chữ) để không lệch vị trí */}
      {createPortal(
        <>
          {soon && <div className={styles.soonToast} role="status">{soon}</div>}
          {showCustomize && (
            <Modal title="Tùy chỉnh tiện ích DIA+" onClose={() => setShowCustomize(false)}>
              <div className={styles.customSheet}>
                {/* Hàng trên: Chưa thêm vào */}
                <div className={styles.customGroupUnadded}>
                  <div className={styles.customGroupHead}>
                    <span className={styles.customGroupTitle}>
                      <span className={styles.dotUnadded} aria-hidden="true" />
                      Chưa thêm vào
                    </span>
                    <span className={styles.customGroupHint}>Chạm để thêm +</span>
                  </div>

                  {unaddedUtilities.length === 0 ? (
                    <div className={styles.customEmpty}>
                      Đã thêm toàn bộ tiện ích ra màn hình chính
                    </div>
                  ) : (
                    <div className={styles.customGrid}>
                      {unaddedUtilities.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`${styles.customTile} ${styles.customTileUnadded}`}
                          onClick={() => handleAddUtility(item.key)}
                        >
                          <span className={styles.actionCircleAdd} aria-hidden="true">
                            <Plus size={14} strokeWidth={3} />
                          </span>
                          {!item.launched && (
                            <span className={styles.soonMiniTag}>Sắp ra mắt</span>
                          )}
                          <div className={`${styles.customTileIconPod} ${styles['pod_' + item.key] || ''}`}>
                            <img
                              src={`/icons/tienich/${item.key}.png`}
                              alt=""
                              className={styles.customTileImg}
                              width="38"
                              height="38"
                            />
                          </div>
                          <span className={styles.tileLabel}>{item.label}</span>
                          <span className={styles.tileSub}>{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hàng dưới: Đã thêm vào */}
                <div className={styles.customGroupAdded}>
                  <div className={styles.customGroupHead}>
                    <span className={styles.customGroupTitle}>
                      <span className={styles.dotAdded} aria-hidden="true" />
                      Đã thêm vào
                    </span>
                    <span className={styles.customGroupHint}>Chạm để ẩn −</span>
                  </div>

                  <div className={styles.customGrid}>
                    {addedUtilities.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`${styles.customTile} ${styles.customTileAdded}`}
                        onClick={() => handleRemoveUtility(item.key)}
                      >
                        <span className={styles.actionCircleRemove} aria-hidden="true">
                          <Minus size={14} strokeWidth={3} />
                        </span>
                        {!item.launched && (
                          <span className={styles.soonMiniTag}>Sắp ra mắt</span>
                        )}
                        <div className={`${styles.customTileIconPod} ${styles['pod_' + item.key] || ''}`}>
                          <img
                            src={`/icons/tienich/${item.key}.png`}
                            alt=""
                            className={styles.customTileImg}
                            width="38"
                            height="38"
                          />
                        </div>
                        <span className={styles.tileLabel}>{item.label}</span>
                        <span className={styles.tileSub}>{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.customFooter}>
                  <button
                    type="button"
                    className={styles.customResetBtn}
                    onClick={handleResetUtilities}
                  >
                    <RotateCcw size={16} aria-hidden="true" /> Mặc định
                  </button>
                  <button
                    type="button"
                    className={styles.customDoneBtn}
                    onClick={() => setShowCustomize(false)}
                  >
                    <Check size={18} strokeWidth={2.5} aria-hidden="true" /> Xong
                  </button>
                </div>
              </div>
            </Modal>
          )}
          {showAdherence && (
            <MedicationHistoryModal medications={medications || []} onClose={() => setShowAdherence(false)} />
          )}
          {showSos && <SosSheet onClose={() => setShowSos(false)} />}
          {showMeds && (
            <Modal title={t.dashboard.todayMeds} onClose={() => setShowMeds(false)}>
              <div className={styles.medSheet}>
                {today.totalScheduled > 0 && (
                  <p className={`${styles.progress} ${allDone ? styles.progressDone : ''}`}>
                    {allDone
                      ? <><CheckCircle2 size={20} aria-hidden="true" /> Đã uống đủ {today.totalTaken}/{today.totalScheduled} cử hôm nay</>
                      : `Đã uống ${today.totalTaken}/${today.totalScheduled} cử hôm nay (${today.score}%)`}
                  </p>
                )}
                <div className={styles.medList}>
                  {todayMedications.map((m) => <MedicationCard key={m.id} medication={m} />)}
                </div>
              </div>
            </Modal>
          )}
          {showGlucose && <GlucoseQuickModal onClose={() => setShowGlucose(false)} onSave={saveGlucose} />}
        </>,
        document.body,
      )}
    </div>
  );
}
