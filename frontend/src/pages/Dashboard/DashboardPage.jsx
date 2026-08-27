import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Pill, Star, Play, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMetrics } from '../../hooks/useMetrics';
import { useMedications } from '../../hooks/useMedications';
import useThemeStore from '../../store/themeStore';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import AddMetricModal from '../../components/metrics/AddMetricModal';
import SuccessToast from '../../components/common/SuccessToast';
import EmptyState from '../../components/common/EmptyState';
import CuteBackground from '../../components/cute/CuteBackground';
import CuteCatWidget from '../../components/cute/CuteCatWidget';
import CuteAstronautCat from '../../components/cute/CuteAstronautCat';
import styles from './DashboardPage.module.css';

function getGreeting(cute, t) {
  const h = new Date().getHours();
  if (cute) {
    if (h < 6) return t.dashboard.greetNightCute;
    if (h < 12) return t.dashboard.greetMorningCute;
    if (h < 18) return t.dashboard.greetAfternoonCute;
    return t.dashboard.greetEveningCute;
  }
  if (h < 6) return t.dashboard.greetNight;
  if (h < 12) return t.dashboard.greetMorning;
  if (h < 18) return t.dashboard.greetAfternoon;
  return t.dashboard.greetEvening;
}

function formatDate(t) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dayName = t.days[now.getDay()];
  return `${dayName}, ${t.dateFormat(pad(now.getDate()), pad(now.getMonth() + 1), now.getFullYear())}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { latestMetrics, fetchLatest, addMetric } = useMetrics();
  const { todayMedications, fetchToday } = useMedications();
  const { isCuteMode } = useThemeStore();
  const t = useT();
  const [showModal, setShowModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('glucose_fasting');

  useEffect(() => {
    fetchLatest();
    fetchToday();
  }, [fetchLatest, fetchToday]);

  const handleSave = async (data) => {
    await addMetric(data);
    fetchLatest();
  };

  const handleMetricSuccess = () => {
    setShowSuccessToast(true);
  };

  const handleOpenAddModal = (type = 'glucose_fasting') => {
    setModalDefaultType(type);
    setShowModal(true);
  };

  const fastingGlucose = latestMetrics?.glucose_fasting?.value;
  const hba1cVal = latestMetrics?.hba1c?.value;
  const bloodPressureVal = latestMetrics?.blood_pressure?.value;

  return (
    <div className={styles.page}>
      {isCuteMode && <CuteBackground />}

      <div className={styles.contentWrap}>
        {/* ── Greeting ── */}
        <div className={styles.greeting}>
          <div className={styles.greetingTop}>
            <div>
              <div className={styles.greetText}>{getGreeting(isCuteMode, t)}</div>
              <div className={styles.userName}>
                {user?.name || '...'} {isCuteMode ? '🌸' : '👋'}
              </div>
              <div className={styles.date}>{formatDate(t)}</div>
            </div>
            <div className={isCuteMode ? styles.iconBtnCute : styles.iconBtn}>
              {isCuteMode ? <Star size={20} fill="currentColor" /> : <Activity size={22} />}
            </div>
          </div>
        </div>

        {/* ── Metrics section (Upcoming Appointments style) ── */}
        <div className={styles.section}>
          <div className={`${styles.sectionHeader} tour-step-2`}>
            <span className={styles.sectionTitle}>
              Chỉ số trung bình (7 ngày qua)
            </span>
            <Link to="/metrics" className={styles.seeAll}>
              Xem tất cả &gt;
            </Link>
          </div>

          {isCuteMode && (
            <div className={styles.cuteCatRow}>
              <CuteCatWidget />
            </div>
          )}

          {/* Horizontal scrollable blue metric cards */}
          <div className={styles.horizontalMetricsRow}>
            <div 
              className={styles.blueMetricCard} 
              onClick={() => handleOpenAddModal('glucose_fasting')}
              style={{ cursor: 'pointer' }}
              title="Bấm để ghi nhận chỉ số đường huyết"
            >
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>Glucose (Đói)</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>
                {fastingGlucose != null ? fastingGlucose : '--'}{' '}
                <span className={styles.blueMetricUnit}>mmol/L</span>
              </div>
              <div className={styles.blueMetricFooter}>
                {fastingGlucose != null 
                  ? `📅 Gần nhất • ${fastingGlucose < 3.9 ? '🚨 Thấp' : fastingGlucose > 7.0 ? '🟠 Cao' : 'Bình thường'}`
                  : '➕ Chưa có dữ liệu • Bấm nhập'}
              </div>
            </div>

            <div 
              className={styles.blueMetricCard}
              onClick={() => handleOpenAddModal('hba1c')}
              style={{ cursor: 'pointer' }}
              title="Bấm để ghi nhận chỉ số HbA1c"
            >
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>HbA1c</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>
                {hba1cVal != null ? hba1cVal : '--'}{' '}
                <span className={styles.blueMetricUnit}>%</span>
              </div>
              <div className={styles.blueMetricFooter}>
                {hba1cVal != null 
                  ? `📅 Gần nhất • ${hba1cVal > 7.0 ? 'Cần kiểm soát' : 'Tốt'}`
                  : '➕ Chưa xét nghiệm • Bấm nhập'}
              </div>
            </div>

            <div 
              className={styles.blueMetricCard}
              onClick={() => handleOpenAddModal('blood_pressure')}
              style={{ cursor: 'pointer' }}
              title="Bấm để ghi nhận huyết áp"
            >
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>Huyết áp</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>
                {bloodPressureVal != null ? bloodPressureVal : '--'}{' '}
                <span className={styles.blueMetricUnit}>mmHg</span>
              </div>
              <div className={styles.blueMetricFooter}>
                {bloodPressureVal != null 
                  ? '📅 Gần nhất • Đã đo'
                  : '➕ Chưa đo huyết áp • Bấm nhập'}
              </div>
            </div>
          </div>
        </div>

        {/* ── NTTU Innovation Challenge Video Promo Banner ── */}
        <div className={styles.section}>
          <div className={styles.videoBannerCard} onClick={() => setShowVideoModal(true)}>
            <div className={styles.videoBannerLeft}>
              <div className={styles.videoBadge}>
                <Sparkles size={13} color="#818cf8" />
                <span>NTTU INNOVATION STARTUP CHALLENGE 2026</span>
              </div>
              <h3 className={styles.videoTitle}>Xem Video Giới Thiệu Dự Án DIA+</h3>
              <p className={styles.videoDesc}>
                Khám phá giải pháp công nghệ AI chăm sóc bệnh nhân đái tháo đường thông minh.
              </p>
              <span className={styles.watchNowBtn}>
                <Play size={13} fill="currentColor" /> Xem Video (Full HD 1080p)
              </span>
            </div>
            <div className={styles.videoThumbWrap}>
              <img src="/videos/diaplus_poster.jpg" alt="Video DIA+" className={styles.videoThumbImg} />
              <div className={styles.playIconRing}>
                <Play size={18} fill="#ffffff" color="#ffffff" />
              </div>
              <span className={styles.hdTagSmall}>1080p</span>
            </div>
          </div>
        </div>

        {/* ── Medication section (Categories replacement) ── */}
        <div className={styles.section}>
          <div className={isCuteMode ? styles.medicationCardCute : styles.medicationCard}>
            {isCuteMode ? (
              <div className={`${styles.cuteMedHeader} tour-step-3`}>
                <div className={styles.cuteMedLeft}>
                  <CuteAstronautCat size="icon" />
                  <span className={styles.medicationTitle}>{t.dashboard.todayMeds}</span>
                </div>
                <Link to="/medications" className={styles.medLink}>{t.dashboard.viewPrescriptionCute}</Link>
              </div>
            ) : (
              <div className={`${styles.medicationHeader} tour-step-3`}>
                <div className={styles.medicationTitle}>
                  <Pill size={18} color="var(--color-primary)" />
                  {t.dashboard.todayMeds}
                </div>
                <Link to="/medications" className={styles.medLink}>{t.dashboard.viewPrescription}</Link>
              </div>
            )}

            {isCuteMode && todayMedications.length === 0 && (
              <div className={styles.cuteAstronautWrapper}>
                <CuteAstronautCat size="full" />
              </div>
            )}

            {!isCuteMode && todayMedications.length === 0 && (
              <EmptyState icon={Pill} title={t.dashboard.noMeds} subtitle={t.dashboard.noMedsSubtitle} />
            )}

            {todayMedications.length > 0 && (
              <>
                {todayMedications.slice(0, 2).map((m) => <MedicationCard key={m.id} medication={m} />)}
                {todayMedications.length > 2 && (
                  <div className={styles.moreMedsHint}>
                    {isCuteMode
                      ? t.dashboard.moreMedsCute.replace('{{count}}', todayMedications.length - 2)
                      : t.dashboard.moreMeds.replace('{{count}}', todayMedications.length - 2)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <AddMetricModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onSuccess={handleMetricSuccess}
          defaultType={modalDefaultType}
        />
      )}

      {showSuccessToast && (
        <SuccessToast onClose={() => setShowSuccessToast(false)} />
      )}

      {showVideoModal && (
        <div className={styles.videoModalOverlay} onClick={() => setShowVideoModal(false)}>
          <div className={styles.videoModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.videoModalHeader}>
              <div className={styles.videoModalTitle}>
                <Sparkles size={16} color="#818cf8" />
                <span>DIAPLUS.VN • NTTU INNOVATION STARTUP CHALLENGE 2026</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowVideoModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.videoModalPlayer}>
              <video
                src="/videos/diaplus_intro_1080p.mp4"
                poster="/videos/diaplus_poster.jpg"
                controls
                autoPlay
                playsInline
                className={styles.modalVideoElement}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
