import { useEffect, useState } from 'react';
import { Pill, CalendarPlus } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useT } from '../../hooks/useT';
import MedicationCard from '../../components/medications/MedicationCard';
import EmptyState from '../../components/common/EmptyState';
import { addMedicationsToCalendar } from '../../utils/calendar';
import styles from './MedicationsPage.module.css';

export default function MedicationsPage() {
  const { medications, loading, fetchMedications } = useMedications();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const t = useT();

  useEffect(() => { fetchMedications(); }, []);

  const handleAddAll = () => {
    setShowMenu(false);
    setSelectionMode(true);
    setSelectedMeds(medications.map(m => m.id));
  };

  const handleConfirmSelected = () => {
    const medsToSync = medications.filter(m => selectedMeds.includes(m.id));
    if (medsToSync.length === 0) return alert('Vui lòng chọn ít nhất một thuốc.');
    addMedicationsToCalendar(medsToSync);
    setSelectionMode(false);
    setSelectedMeds([]);
  };

  const toggleSelectMed = (id) => {
    setSelectedMeds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 className={`${styles.title} tour-step-6`}>{t.medications.title}</h1>
          <p className={styles.subtitle}>{t.medications.subtitle}</p>
        </div>
        {!loading && (
          selectionMode ? (
            <button className={styles.confirmBtn} onClick={handleConfirmSelected}>
              Xác nhận thêm
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)}>
                <CalendarPlus size={20} />
              </button>
              {showMenu && (
                <div className={styles.popupMenu}>
                  <button className={styles.menuItem} onClick={handleAddAll}>Thêm tất cả thuốc</button>
                  <button className={styles.menuItem} onClick={() => { setShowMenu(false); setSelectionMode(true); }}>Lựa chọn thuốc thêm</button>
                </div>
              )}
            </div>
          )
        )}
      </div>

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
          {medications.map((m) => (
            <MedicationCard 
              key={m.id} 
              medication={m} 
              isSelectable={selectionMode}
              isSelected={selectedMeds.includes(m.id)}
              onToggleSelect={() => toggleSelectMed(m.id)}
              onAddAllClick={() => {
                setSelectionMode(true);
                setSelectedMeds(medications.map(med => med.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
