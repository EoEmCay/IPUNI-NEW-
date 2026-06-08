import { useEffect } from 'react';
import { Pill } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import MedicationCard from '../../components/medications/MedicationCard';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const { medications, loading, fetchMedications } = useMedications();

  useEffect(() => { fetchMedications(); }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Đơn thuốc & Nhắc uống</h1>
      <p className={styles.subtitle}>Quản lý thuốc từ bác sĩ kê</p>

      {loading ? null : medications.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Chưa có đơn thuốc"
          subtitle="Bác sĩ chưa kê đơn thuốc nào. Vui lòng liên hệ bác sĩ phụ trách."
        />
      ) : (
        <div className={styles.list}>
          {medications.map((m) => <MedicationCard key={m.id} medication={m} />)}
        </div>
      )}
    </div>
  );
}
