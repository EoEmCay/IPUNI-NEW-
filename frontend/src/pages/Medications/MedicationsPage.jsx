import { useEffect, useState, useMemo } from 'react';
import { Pill, Calendar as CalendarIcon, User, CalendarDays, Award, Flame, Plus, History } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useT } from '../../hooks/useT';
import { withDoctorPrefix } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import MedicationCard from '../../components/medications/MedicationCard';
import MedicationFormModal from '../../components/medications/MedicationFormModal';
import MedicationHistoryModal from '../../components/medications/MedicationHistoryModal';
import BulkCalendarExportModal from '../../components/medications/BulkCalendarExportModal';
import EmptyState from '../../components/common/EmptyState';
import { calculateAdherenceStats } from '../../store/medicationAdherenceStore';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { medications, loading, fetchMedications } = useMedications();
  const t = useT();

  useEffect(() => { fetchMedications(); }, []);

  const stats = useMemo(() => calculateAdherenceStats(medications, 7), [medications]);

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
          <button 
            className={styles.addBtn}
            onClick={() => setShowForm(true)}
            style={{ background: '#F1F5F9', color: '#1E293B', border: '1px solid #CBD5E1' }}
          >
            <Plus size={18} /> Thêm thuốc
          </button>
          {medications && medications.length > 0 && (
            <>
              <button 
                className={styles.addBtn}
                onClick={() => setShowHistoryModal(true)}
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
              >
                <History size={18} /> Nhật ký & Điểm số
              </button>
              <button 
                className={styles.addBtn} 
                style={{ background: 'var(--color-primary)', color: 'white', border: 'none' }}
                onClick={() => setShowBulkExport(true)}
              >
                <CalendarIcon size={18} /> Thêm vào lịch
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Banner Điểm Tuân Thủ Uống Thuốc & Người Thân Nhắc Nhở ── */}
      {medications && medications.length > 0 && (
        <div 
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={24} color="#38BDF8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>{stats.score}%</span>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Điểm tuân thủ (7 ngày)</span>
                <span style={{ fontSize: 11, background: 'rgba(251, 146, 60, 0.2)', color: '#FB923C', padding: '2px 8px', borderRadius: 100, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={12} fill="#FB923C" /> {stats.streakDays} ngày liên tiếp
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>
                Đã uống {stats.totalTaken}/{stats.totalScheduled} cữ • Bấm để xem nhật ký & cài Người nhà nhắc nhở &gt;
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{
              background: '#2563EB',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Xem Chi Tiết
          </button>
        </div>
      )}

      {showHistoryModal && (
        <MedicationHistoryModal
          medications={medications}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

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
