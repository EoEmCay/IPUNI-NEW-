import { useEffect } from 'react';
import { Pill } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const { medications, loading, fetchMedications } = useMedications();
  const t = useT();

  useEffect(() => { fetchMedications(); }, []);

  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} tour-step-6`}>{t.medications.title}</h1>
      <p className={styles.subtitle}>{t.medications.subtitle}</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {t.common?.loading || 'Đang tải dữ liệu...'}
        </div>
      ) : (!medications || medications.length === 0) ? (
        <EmptyState
          icon={Pill}
          title={t.medications.noMeds}
          subtitle={t.medications.noMedsSubtitle}
        />
      ) : (
        <div className={styles.list}>
          {medications.map((m) => <MedicationCard key={m.id} medication={m} />)}
        </div>
      )}
    </div>
  );
}
