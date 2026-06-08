import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Pill, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMetrics } from '../../hooks/useMetrics';
import { useMedications } from '../../hooks/useMedications';
import useThemeStore from '../../store/themeStore';
import { MetricCard, AddMetricCard } from '../../components/metrics/MetricCard';
import MedicationCard from '../../components/medications/MedicationCard';
import AddMetricModal from '../../components/metrics/AddMetricModal';
import SuccessToast from '../../components/common/SuccessToast';
import EmptyState from '../../components/common/EmptyState';
import CuteBackground from '../../components/cute/CuteBackground';
import CuteCatWidget from '../../components/cute/CuteCatWidget';
import CuteAstronautCat from '../../components/cute/CuteAstronautCat';
import styles from './DashboardPage.module.css';

function getGreeting(cute) {
  const h = new Date().getHours();
  if (cute) {
    if (h < 6) return 'Chúc ngủ ngon,';
    if (h < 12) return 'Chào buổi sáng xinh,';
    if (h < 18) return 'Chiều vui vẻ nha,';
    return 'Buổi tối dễ thương,';
  }
  if (h < 6) return 'Chào buổi đêm,';
  if (h < 12) return 'Chào buổi sáng,';
  if (h < 18) return 'Chào buổi chiều,';
  return 'Chào buổi tối,';
}

function formatVNDate() {
  const now = new Date();
  const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${days[now.getDay()]}, ${pad(now.getDate())} tháng ${pad(now.getMonth() + 1)} ${now.getFullYear()}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { latestMetrics, fetchLatest, addMetric } = useMetrics();
  const { todayMedications, fetchToday } = useMedications();
  const { isCuteMode } = useThemeStore();
  const [showModal, setShowModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    fetchLatest();
    fetchToday();
  }, []);

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
              <div className={styles.greetText}>{getGreeting(isCuteMode)}</div>
              <div className={styles.userName}>
                {user?.name || '...'} {isCuteMode ? '🌸' : '👋'}
              </div>
              <div className={styles.date}>{formatVNDate()}</div>
            </div>
            <div className={isCuteMode ? styles.iconBtnCute : styles.iconBtn}>
              {isCuteMode ? <Star size={20} fill="currentColor" /> : <Activity size={22} />}
            </div>
          </div>
        </div>

        {/* ── Metrics section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              {isCuteMode ? '✨ Chỉ số gần nhất' : 'Chỉ số gần nhất'}
            </span>
            <Link to="/metrics" className={styles.seeAll}>
              {isCuteMode ? 'Xem tất cả 🔍' : 'Xem tất cả >'}
            </Link>
          </div>

          {isCuteMode && (
            <div className={styles.cuteCatRow}>
              <CuteCatWidget />
            </div>
          )}

          <div className={styles.metricsGrid}>
            <MetricCard type="fasting" metric={latestMetrics?.fasting} />
            <AddMetricCard onClick={() => setShowModal(true)} />
          </div>
        </div>

        {/* ── Medication section ── */}
        <div className={styles.section}>
          <div className={isCuteMode ? styles.medicationCardCute : styles.medicationCard}>
            {isCuteMode ? (
              <div className={styles.cuteMedHeader}>
                <div className={styles.cuteMedLeft}>
                  <CuteAstronautCat size="icon" />
                  <span className={styles.medicationTitle}>Thuốc hôm nay</span>
                </div>
                <Link to="/medications" className={styles.medLink}>Xem đơn 💊</Link>
              </div>
            ) : (
              <div className={styles.medicationHeader}>
                <div className={styles.medicationTitle}>
                  <Pill size={18} color="#1B5FA6" />
                  Thuốc hôm nay
                </div>
                <Link to="/medications" className={styles.medLink}>Xem đơn</Link>
              </div>
            )}

            {isCuteMode && todayMedications.length === 0 && (
              <div className={styles.cuteAstronautWrapper}>
                <CuteAstronautCat size="full" />
              </div>
            )}

            {!isCuteMode && todayMedications.length === 0 && (
              <EmptyState icon={Pill} title="Chưa có đơn thuốc" subtitle="Bác sĩ chưa kê đơn thuốc nào." />
            )}

            {todayMedications.length > 0 &&
              todayMedications.slice(0, 2).map((m) => <MedicationCard key={m.id} medication={m} />)
            }
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
