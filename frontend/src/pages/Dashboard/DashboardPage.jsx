import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Pill, CheckCircle2, Star, CalendarDays, Mic, Settings2,
  ScanText, CalendarPlus, AlarmClock, Radio, BarChart3, NotebookPen, Salad, Droplet, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMedications } from '../../hooks/useMedications';
import useMedicationsStore from '../../store/medicationsStore';
import { calculateAdherenceStats } from '../../store/medicationAdherenceStore';
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
import DemoCountdown from '../../components/common/DemoCountdown';
import DayChip from '../../components/common/DayChip';
import styles from './DashboardPage.module.css';

const BELL_CSS = { btn: styles.bellBtn, hasBadge: styles.bellHasBadge, active: styles.bellActive, badge: styles.bellBadge };

// Ô tiện ích: `to` = mở trang đã có; không có `to` = chưa làm, báo "sắp ra mắt".
const UTILITIES = [
  { key: 'scan', label: 'Quét AI', icon: ScanText, tone: 'indigo', badge: 'MỚI', to: '/scan' },
  { key: 'booking', label: 'Đặt lịch bác sĩ', icon: CalendarPlus, tone: 'red', badge: 'HOT' },
  { key: 'schedule', label: 'Lịch uống thuốc', icon: AlarmClock, tone: 'amber', to: '/medications' },
  { key: 'cgm', label: 'Kết nối CGM', icon: Radio, tone: 'gray' },
  { key: 'adherence', label: 'Biểu đồ tuân thủ', icon: BarChart3, tone: 'blue', modal: true },
  { key: 'diary', label: 'Nhật ký sức khỏe', icon: NotebookPen, tone: 'cyan', to: '/glucose' },
  { key: 'nutrition', label: 'Chế độ dinh dưỡng', icon: Salad, tone: 'green', to: '/advice' },
  { key: 'sos', label: 'Cảnh báo SOS', tone: 'sos' },
];

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

function MascotFace() {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <ellipse cx="50" cy="50" fill="#2563eb" rx="42" ry="40" />
      <rect fill="#0284c7" height="20" rx="4" width="8" x="2" y="40" />
      <rect fill="#0284c7" height="20" rx="4" width="8" x="90" y="40" />
      <ellipse cx="50" cy="54" fill="#f8fafc" rx="33" ry="29" />
      <ellipse cx="38" cy="50" fill="#1e293b" rx="6" ry="8" />
      <ellipse cx="62" cy="50" fill="#1e293b" rx="6" ry="8" />
      <circle cx="36" cy="47" fill="#ffffff" r="2.5" />
      <circle cx="60" cy="47" fill="#ffffff" r="2.5" />
      <ellipse cx="32" cy="60" fill="#fda4af" rx="4" ry="2" />
      <ellipse cx="68" cy="60" fill="#fda4af" rx="4" ry="2" />
      <path d="M44 60 Q50 67 56 60" fill="none" stroke="#1e293b" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

// Trang chủ (giao diện mới 10/2026): header riêng, trợ lý, banner, lưới tiện ích; bên dưới vẫn giữ
// "Thuốc hôm nay" (nút Tôi đã uống - nhật ký uống thuốc là nguồn để báo người nhà) + đường huyết.
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { medications, todayMedications, fetchToday, fetchMedications } = useMedications();
  const [showAdherence, setShowAdherence] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showMeds, setShowMeds] = useState(false);
  const [showGlucose, setShowGlucose] = useState(false);
  const { metrics, fetchMetrics, addMetric } = useMetrics();
  const unit = getGlucoseUnit();
  const loadGlucose = () => fetchMetrics(undefined, 30);
  useEffect(() => { loadGlucose(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const latest = (metrics || []).find((m) => m.measurement_type?.startsWith('glucose'));
  const latestStatus = latest && getMetricStatus(latest.measurement_type, latest.value, user?.diagnosis);
  const saveGlucose = async (data) => { await saveGlucoseReading(addMetric, data, user?.diagnosis); await loadGlucose(); };
  const medicationStatus = useMedicationsStore((s) => s.medicationStatus);
  const t = useT();
  const [soon, setSoon] = useState(null);
  const [slide, setSlide] = useState(0);
  const carouselRef = useRef(null);
  const gridRef = useRef(null);
  const [gridVisible, setGridVisible] = useState(true);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  // Robot nổi tự ẩn khi lưới tiện ích chạy qua đúng dải robot đứng (~80-170px từ đáy) -> không bao giờ
  // che ô SOS/tiện ích; cuộn tới phần khác thì robot hiện lại.
  useEffect(() => {
    const el = gridRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => setGridVisible(entry.isIntersecting), {
      rootMargin: `${-(window.innerHeight - 170)}px 0px -80px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!soon) return undefined;
    const timer = setTimeout(() => setSoon(null), 2200);
    return () => clearTimeout(timer);
  }, [soon]);

  const today = useMemo(
    () => calculateAdherenceStats(todayMedications, 1),
    [todayMedications, medicationStatus] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const allDone = today.totalScheduled > 0 && today.totalTaken >= today.totalScheduled;

  const open = (item) => {
    if (item.to) return navigate(item.to);
    if (item.key === 'sos') return setShowSos(true);
    if (item.modal) { fetchMedications().catch(() => {}); return setShowAdherence(true); }
    return setSoon(item.label);
  };
  const onCarouselScroll = (e) => {
    const el = e.currentTarget;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goSlide = (i) => {
    const el = carouselRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button type="button" className={styles.vip} onClick={() => navigate('/settings')}>
            <span className={styles.vipStar}><Star size={16} fill="currentColor" aria-hidden="true" /></span>
            <span className={styles.vipText}>HỘI VIÊN<span className={styles.vipSub}>ĐẶC BIỆT</span></span>
          </button>
          <DayChip />
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
        <DemoCountdown />
      </header>

      <section className={styles.assistant}>
        <button type="button" className={styles.assistantMain} onClick={() => setSoon('Trợ lý DIAPLUS')}>
          <span className={styles.assistantIcon}><CalendarDays size={22} aria-hidden="true" /></span>
          <span className={styles.assistantText}>Trò chuyện cùng Trợ lý <b>DIAPLUS</b></span>
        </button>
        <button type="button" className={styles.micBtn} onClick={() => setSoon('Trợ lý giọng nói')} aria-label="Nói với trợ lý">
          <Mic size={22} aria-hidden="true" />
        </button>
      </section>

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
          <button type="button" className={styles.customize} onClick={() => setSoon('Tùy chỉnh tiện ích')}>
            <Settings2 size={16} aria-hidden="true" /> Tùy chỉnh
          </button>
        </div>
        <div className={styles.grid} ref={gridRef}>
          {UTILITIES.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" className={styles.tile} onClick={() => open(item)}>
                {item.badge && (
                  <span className={`${styles.badge} ${item.badge === 'HOT' ? styles.badgeHot : ''}`}>{item.badge}</span>
                )}
                <span className={`${styles.tileIcon} ${styles[item.tone]}`}>
                  {Icon ? <Icon size={26} aria-hidden="true" /> : <span className={styles.sosText}>SOS</span>}
                </span>
                <span className={styles.tileLabel}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Thuốc hôm nay + Đường huyết: 2 nút gọn. Bấm thuốc -> bảng có nút "Tôi đã uống" (nguồn nhật ký báo người nhà) */}
      <div className={styles.quickRow}>
        <button
          type="button"
          className={`${styles.quick} tour-step-3`}
          onClick={() => (todayMedications.length ? setShowMeds(true) : navigate('/scan'))}
        >
          <span className={styles.quickHead}><Pill size={20} aria-hidden="true" /> {t.dashboard.todayMeds}</span>
          <span className={`${styles.quickValue} ${allDone ? styles.quickDone : ''}`}>
            {todayMedications.length === 0 ? 'Chưa có đơn'
              : today.totalScheduled === 0 ? `${todayMedications.length} thuốc`
                : allDone ? <><CheckCircle2 size={18} aria-hidden="true" /> Đã uống đủ</>
                  : `Đã uống ${today.totalTaken}/${today.totalScheduled}`}
          </span>
          <span className={styles.quickHint}>
            {todayMedications.length ? 'Bấm để đánh dấu' : 'Bấm để quét đơn'} <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>

        <button type="button" className={styles.quick} onClick={() => setShowGlucose(true)}>
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

      {/* Nút nổi + thông báo gắn thẳng vào body: nằm ngoài vùng cuộn có zoom (cỡ chữ) để không lệch vị trí */}
      {createPortal(
        <>
          {!gridVisible && (
            <button type="button" className={styles.mascot} onClick={() => setSoon('Trợ lý DIAPLUS')} aria-label="Trợ lý DIAPLUS">
              <MascotFace />
            </button>
          )}
          {soon && <div className={styles.soonToast} role="status">{soon} sắp ra mắt</div>}
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
                      ? <><CheckCircle2 size={20} aria-hidden="true" /> Hôm nay đã dùng đủ thuốc</>
                      : `Hôm nay đã dùng ${today.totalTaken}/${today.totalScheduled} thuốc`}
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
