import { useEffect, useState } from 'react';
import { Pill, Plus, Calendar as CalendarIcon, User, CalendarDays } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useT } from '../../hooks/useT';
import { withDoctorPrefix } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import MedicationCard from '../../components/medications/MedicationCard';
import MedicationFormModal from '../../components/medications/MedicationFormModal';
import BulkCalendarExportModal from '../../components/medications/BulkCalendarExportModal';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const { medications, loading, fetchMedications } = useMedications();
  const t = useT();

  useEffect(() => { fetchMedications(); }, []);

  // Group medications by Prescription Section
  const groupedMedications = medications?.reduce((acc, med) => {
    const doctor = med.doctor_name || 'Khác';
    const dateStr = med.prescribed_at 
        ? new Date(med.prescribed_at).toLocaleDateString('vi-VN') 
        : (med.created_at ? new Date(med.created_at).toLocaleDateString('vi-VN') : 'Không rõ ngày');
    
    const key = `${doctor}_${dateStr}`;
    if (!acc[key]) {
      acc[key] = {
        doctor_name: med.doctor_name,
        prescribed_at: med.prescribed_at || med.created_at,
        next_appointment_date: med.next_appointment_date,
        medications: []
      };
    }
    // Update next_appointment_date if not present but exists in another medication of the same group
    if (med.next_appointment_date) {
      acc[key].next_appointment_date = med.next_appointment_date;
    }
    acc[key].medications.push(med);
    return acc;
  }, {});

  const groups = groupedMedications ? Object.values(groupedMedications).sort((a, b) => {
    const dateA = new Date(a.prescribed_at || 0).getTime();
    const dateB = new Date(b.prescribed_at || 0).getTime();
    return dateB - dateA; // Newest first
  }) : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} tour-step-6`}>{t.medications.title}</h1>
          <p className={styles.subtitle}>{t.medications.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {medications && medications.length > 0 && (
            <button 
              className={styles.addBtn} 
              style={{ background: 'var(--color-primary)', color: 'white', border: 'none' }}
              onClick={() => setShowBulkExport(true)}
            >
              <CalendarIcon size={18} /> Thêm vào lịch
            </button>
          )}
        </div>
      </div>

      {showBulkExport && (
        <BulkCalendarExportModal 
          medications={medications}
          onClose={() => setShowBulkExport(false)} 
        />
      )}

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
          {groups.map((group, index) => (
            <div key={index} className={styles.prescriptionSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.doctorInfo}>
                  <User size={18} className={styles.headerIcon} />
                  <span className={styles.doctorName}>
                    {group.doctor_name ? withDoctorPrefix(group.doctor_name) : 'Đơn thuốc tự tạo (Không có Bác sĩ kê đơn)'}
                  </span>
                </div>
                <div className={styles.dateInfo}>
                  {group.prescribed_at && (
                    <span className={styles.dateBadge}>
                      <CalendarDays size={14} /> Ngày khám: {formatDateVN(group.prescribed_at)}
                    </span>
                  )}
                  {group.next_appointment_date && (
                    <span className={`${styles.dateBadge} ${styles.highlightBadge}`}>
                      📅 Tái khám: {formatDateVN(group.next_appointment_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.sectionMedications}>
                {group.medications.map((m) => (
                  <MedicationCard key={m.id} medication={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
