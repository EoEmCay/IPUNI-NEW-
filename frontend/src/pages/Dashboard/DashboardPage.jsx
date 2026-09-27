import { useEffect, useMemo } from 'react';
import { Pill, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMedications } from '../../hooks/useMedications';
import useMedicationsStore from '../../store/medicationsStore';
import { calculateAdherenceStats } from '../../store/medicationAdherenceStore';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import EmptyState from '../../components/common/EmptyState';
import GlucoseCard from '../../components/metrics/GlucoseCard';
import styles from './DashboardPage.module.css';

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 6) return t.dashboard.greetNight;
  if (h < 12) return t.dashboard.greetMorning;
  if (h < 18) return t.dashboard.greetAfternoon;
  return t.dashboard.greetEvening;
}

function formatDate(t) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.days[now.getDay()]}, ${t.dateFormat(pad(now.getDate()), pad(now.getMonth() + 1), now.getFullYear())}`;
}

// Trang "Hôm nay": thuốc cần uống (nút "Tôi đã uống") + đường huyết bản gọn.
export default function DashboardPage() {
  const { user } = useAuth();
  const { todayMedications, fetchToday } = useMedications();
  // Đổi khi bấm "Tôi đã uống" -> tính lại tiến độ; nhật ký uống thuốc vẫn được ghi như cũ
  const medicationStatus = useMedicationsStore((s) => s.medicationStatus);
  const t = useT();

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const today = useMemo(
    () => calculateAdherenceStats(todayMedications, 1),
    [todayMedications, medicationStatus] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const allDone = today.totalScheduled > 0 && today.totalTaken >= today.totalScheduled;

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <div className={styles.greetText}>{getGreeting(t)}</div>
        <div className={styles.userName}>{user?.name || '...'} 👋</div>
        <div className={styles.date}>{formatDate(t)}</div>
      </div>

      <section className={styles.medicationCard} aria-labelledby="today-meds">
        <div className={`${styles.medicationHeader} tour-step-3`}>
          <h2 id="today-meds" className={styles.medicationTitle}>
            <Pill size={20} color="var(--color-primary)" aria-hidden="true" />
            {t.dashboard.todayMeds}
          </h2>
        </div>

        {today.totalScheduled > 0 && (
          <p className={`${styles.progress} ${allDone ? styles.progressDone : ''}`}>
            {allDone
              ? <><CheckCircle2 size={20} aria-hidden="true" /> Hôm nay đã dùng đủ thuốc</>
              : `Hôm nay đã dùng ${today.totalTaken}/${today.totalScheduled} thuốc`}
          </p>
        )}

        {todayMedications.length === 0 ? (
          <EmptyState icon={Pill} title={t.dashboard.noMeds} subtitle="Bấm nút Quét đơn ở giữa thanh dưới để thêm thuốc." />
        ) : (
          <div className={styles.medList}>
            {todayMedications.map((m) => <MedicationCard key={m.id} medication={m} />)}
          </div>
        )}
      </section>

      <GlucoseCard />
    </div>
  );
}
