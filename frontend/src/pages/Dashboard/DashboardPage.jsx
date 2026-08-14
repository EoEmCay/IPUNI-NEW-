import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Pill, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMetrics } from '../../hooks/useMetrics';
import { useMedications } from '../../hooks/useMedications';
import useThemeStore from '../../store/themeStore';
import { useT } from '../../hooks/useT';
import { MetricCard, AddMetricCard } from '../../components/metrics/MetricCard';
import { AverageMetricCard } from '../../components/metrics/AverageMetricCard';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchLatest, addMetric } = useMetrics();
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
            <div className={styles.blueMetricCard}>
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>Glucose (Đói)</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>6.2 <span className={styles.blueMetricUnit}>mmol/L</span></div>
              <div className={styles.blueMetricFooter}>📅 7 ngày qua • Bình thường</div>
            </div>

            <div className={styles.blueMetricCard}>
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>HbA1c</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>6.5 <span className={styles.blueMetricUnit}>%</span></div>
              <div className={styles.blueMetricFooter}>📅 7 ngày qua • Tốt</div>
            </div>

            <div className={styles.blueMetricCard}>
              <div className={styles.blueMetricHeader}>
                <span className={styles.blueMetricTitle}>Huyết áp</span>
                <Activity size={16} color="#ffffff" />
              </div>
              <div className={styles.blueMetricValue}>120/80 <span className={styles.blueMetricUnit}>mmHg</span></div>
              <div className={styles.blueMetricFooter}>📅 7 ngày qua • Ổn định</div>
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
                  <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    {isCuteMode 
                      ? t.dashboard.moreMedsCute.replace('{{count}}', todayMedications.length - 2)
                      : t.dashboard.moreMeds.replace('{{count}}', todayMedications.length - 2)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Doctor section (Danh sách Bác sĩ - Find Doctors style) ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              Danh sách Bác sĩ
            </span>
            <Link to="/appointments" className={styles.seeAll}>
              Xem tất cả &gt;
            </Link>
          </div>
          <div className={styles.doctorListSummary}>
            <div 
              className={styles.mockupDoctorCard}
              onClick={() => navigate('/doctor/B%C3%A1c%20s%C4%A9%20DIA%2B')}
            >
              <div className={styles.mockupDoctorTop}>
                <img 
                  src="https://ui-avatars.com/api/?name=DIA%2B&background=1B5FA6&color=fff&size=150" 
                  alt="Bác sĩ DIA+" 
                  className={styles.mockupDoctorAvatar}
                />
                <div className={styles.mockupDoctorInfo}>
                  <div className={styles.mockupDoctorName}>Chuyên gia Bác sĩ DIA+</div>
                  <div className={styles.mockupDoctorSub}>Đái tháo đường &amp; Dinh dưỡng | DIA+ Center</div>
                  <div className={styles.mockupDoctorRatingRow}>
                    <span className={styles.starText}>⭐ 5.0</span>
                    <span className={styles.timeText}>🕒 10:30 - 17:30</span>
                  </div>
                </div>
              </div>
              <button className={styles.fullWidthBookBtn}>Đặt lịch hẹn</button>
            </div>
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
