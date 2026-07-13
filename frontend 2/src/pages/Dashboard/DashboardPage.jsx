import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Pill, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMetrics } from '../../hooks/useMetrics';
import { useMedications } from '../../hooks/useMedications';
import useThemeStore from '../../store/themeStore';
import { useT } from '../../hooks/useT';
import { MetricCard, AddMetricCard } from '../../components/metrics/MetricCard';
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

        {/* ── Metrics section ── */}
        <div className={`${styles.section} tour-step-2`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              {isCuteMode ? t.dashboard.metricsSectionCute : t.dashboard.metricsSection}
            </span>
            <Link to="/metrics" className={styles.seeAll}>
              {isCuteMode ? t.dashboard.viewAllCute : t.dashboard.viewAll}
            </Link>
          </div>

          {isCuteMode && (
            <div className={styles.cuteCatRow}>
              <CuteCatWidget />
            </div>
          )}

          <div className={styles.metricsGrid}>
            <MetricCard type="glucose_fasting" metric={latestMetrics?.glucose_fasting} />
            <MetricCard type="glucose_postmeal" metric={latestMetrics?.glucose_postmeal} />
            <MetricCard type="blood_pressure" metric={latestMetrics?.blood_pressure} />
            <AddMetricCard onClick={() => setShowModal(true)} />
          </div>
        </div>

        {/* ── Medication section ── */}
        <div className={`${styles.section} tour-step-3`}>
          <div className={isCuteMode ? styles.medicationCardCute : styles.medicationCard}>
            {isCuteMode ? (
              <div className={styles.cuteMedHeader}>
                <div className={styles.cuteMedLeft}>
                  <CuteAstronautCat size="icon" />
                  <span className={styles.medicationTitle}>{t.dashboard.todayMeds}</span>
                </div>
                <Link to="/medications" className={styles.medLink}>{t.dashboard.viewPrescriptionCute}</Link>
              </div>
            ) : (
              <div className={styles.medicationHeader}>
                <div className={styles.medicationTitle}>
                  <Pill size={18} color="#1B5FA6" />
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
                  <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    {isCuteMode ? `Và ${todayMedications.length - 2} loại thuốc khác đang chờ bạn uống 🐾` : `Còn ${todayMedications.length - 2} loại thuốc khác chưa uống`}
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
        />
      )}

      {showSuccessToast && (
        <SuccessToast onClose={() => setShowSuccessToast(false)} />
      )}
    </div>
  );
}
