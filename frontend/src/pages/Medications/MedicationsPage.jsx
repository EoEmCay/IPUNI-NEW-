import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Camera, PenLine, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useAppointments } from '../../hooks/useAppointments';
import { useT } from '../../hooks/useT';
import { withDoctorPrefix } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import { groupByPrescription, LOW_SUPPLY_DAYS } from '../../utils/prescription';
import MedicationTile, { MedicationGrid } from '../../components/medications/MedicationTile';
import MedicationDetailModal from '../../components/medications/MedicationDetailModal';
import MedicationFormModal from '../../components/medications/MedicationFormModal';
import PrescriptionInfoModal from '../../components/medications/PrescriptionInfoModal';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';
import PageHeader from '../../components/common/PageHeader';

export default function MedicationsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { medications, loading, fetchMedications } = useMedications();
  const { appointments, fetchAppointments } = useAppointments();
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  // Quản lý trạng thái mở/thu gọn của từng đơn thuốc:
  // Mặc định: đơn đang uống (active) thì mở (true), đơn đã uống xong (collapsed) thì thu gọn (false)
  const [openMap, setOpenMap] = useState({});

  const isGroupOpen = (group) => {
    if (openMap[group.key] !== undefined) {
      return openMap[group.key];
    }
    return group.status !== 'collapsed';
  };

  const toggleGroupOpen = (group, e) => {
    if (e) e.stopPropagation();
    const currentlyOpen = isGroupOpen(group);
    setOpenMap((prev) => ({
      ...prev,
      [group.key]: !currentlyOpen,
    }));
  };

  useEffect(() => {
    fetchMedications();
    fetchAppointments().catch(() => {}); // chỉ để hiện lời dặn / ngày tái khám, lỗi thì bỏ qua
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupByPrescription(medications || []);
  const firstCollapsed = groups.findIndex((g) => g.status === 'collapsed');

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tủ thuốc"
        action={(
          <button type="button" className={styles.addBtn} onClick={() => setShowAddChoice(true)}>
            <Plus size={22} aria-hidden="true" /> Thêm thuốc
          </button>
        )}
      />

      {loading ? (
        <p className={styles.loading}>{t.common.loading}</p>
      ) : groups.length === 0 ? (
        <EmptyState icon={Pill} title="Tủ thuốc đang trống" subtitle="Bấm Thêm thuốc để quét đơn hoặc nhập tay." />
      ) : (
        <div className={styles.list}>
          {groups.map((group, i) => {
            const isOpen = isGroupOpen(group);
            const collapsed = !isOpen;
            return (
              <section key={group.key} className={styles.prescription} aria-label={`Đơn thuốc ${group.number}`}>
                {i === firstCollapsed && <h2 className={styles.doneHeading}>Đơn đã uống xong</h2>}
                <div
                  className={`${styles.prescriptionHead} ${group.status !== 'active' ? styles.doneHead : ''}`}
                  onClick={() => (collapsed ? toggleGroupOpen(group) : setSelectedGroup(group))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      collapsed ? toggleGroupOpen(group) : setSelectedGroup(group);
                    }
                  }}
                  aria-expanded={isOpen}
                >
                  <span className={styles.badge} style={{ background: group.status === 'active' ? group.color.c : 'var(--color-text-secondary)' }}>
                    Đơn {group.number}
                  </span>
                  <span className={styles.headText}>
                    <span className={styles.headTitle}>
                      {group.prescribed_at ? `Ngày ${formatDateVN(group.prescribed_at)}` : 'Thuốc tự thêm'}
                    </span>
                    <span className={styles.headSub}>
                      {group.doctor_name ? withDoctorPrefix(group.doctor_name) : 'Không có bác sĩ kê đơn'}
                      {group.status === 'active' && group.next_appointment_date && ` · Tái khám ${formatDateVN(group.next_appointment_date)}`}
                    </span>
                    <SupplyStatus group={group} />
                  </span>
                  <button
                    type="button"
                    className={styles.chevronBtn}
                    onClick={(e) => toggleGroupOpen(group, e)}
                    aria-label={isOpen ? `Thu gọn Đơn ${group.number}` : `Mở xem Đơn ${group.number}`}
                    title={isOpen ? 'Bấm để thu gọn đơn thuốc' : 'Bấm để mở đơn thuốc'}
                  >
                    <ChevronDown
                      size={22}
                      strokeWidth={2.2}
                      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : styles.chevronCollapsed}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className={group.status !== 'active' ? styles.doneTiles : undefined}>
                    <MedicationGrid>
                      {group.medications.map((m) => (
                        <MedicationTile key={m.id} medication={m} accent={group.color} onClick={() => setSelectedMed(m)} />
                      ))}
                    </MedicationGrid>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {showAddChoice && (
        <Modal title="Thêm thuốc" onClose={() => setShowAddChoice(false)}>
          <div className={styles.choices}>
            <button type="button" className={styles.choice} onClick={() => navigate('/scan')}>
              <Camera size={28} aria-hidden="true" />
              <span>
                <span className={styles.choiceTitle}>Quét đơn thuốc</span>
                <span className={styles.choiceDesc}>Chụp ảnh đơn, app tự đọc thuốc và giờ uống</span>
              </span>
            </button>
            <button type="button" className={styles.choice} onClick={() => { setShowAddChoice(false); setShowForm(true); }}>
              <PenLine size={28} aria-hidden="true" />
              <span>
                <span className={styles.choiceTitle}>Nhập tay</span>
                <span className={styles.choiceDesc}>Tự gõ tên thuốc, liều và giờ uống</span>
              </span>
            </button>
          </div>
        </Modal>
      )}
      {showForm && (
        <MedicationFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchMedications(); }}
        />
      )}
      {selectedMed && <MedicationDetailModal medication={selectedMed} onClose={() => setSelectedMed(null)} />}
      {selectedGroup && (
        <PrescriptionInfoModal
          group={selectedGroup}
          appointments={appointments || []}
          onClose={() => setSelectedGroup(null)}
          onChanged={() => { setSelectedGroup(null); fetchMedications(); }}
        />
      )}
    </div>
  );
}

// Dòng trạng thái hết thuốc dưới tiêu đề đơn.
function SupplyStatus({ group }) {
  if (group.status !== 'active') {
    return (
      <span className={styles.doneText}>
        <CheckCircle2 size={16} aria-hidden="true" /> Đã uống xong · hết thuốc ngày {formatDateVN(group.endDate)}
      </span>
    );
  }
  if (group.daysLeft == null || group.daysLeft > LOW_SUPPLY_DAYS) return null;
  return (
    <span className={styles.lowText}>
      {group.daysLeft === 0 ? 'Hôm nay là ngày thuốc cuối' : `Còn ${group.daysLeft} ngày nữa hết thuốc`} · nhớ tái khám hoặc mua thêm
    </span>
  );
}
