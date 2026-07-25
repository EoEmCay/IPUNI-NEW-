import { useEffect, useState } from 'react';
import { Pill, Plus } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import MedicationFormModal from '../../components/medications/MedicationFormModal';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const [showForm, setShowForm] = useState(false);
  const { medications, loading, fetchMedications } = useMedications();
  const t = useT();

  useEffect(() => { fetchMedications(); }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} tour-step-6`}>{t.medications.title}</h1>
          <p className={styles.subtitle}>{t.medications.subtitle}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={18} /> Thêm thuốc
        </button>
      </div>

      {showForm && (
        <MedicationFormModal 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchMedications();
          }} 
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {t.common.loading}
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
