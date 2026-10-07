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

export default function MedicationsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { medications, loading, fetchMedications } = useMedications();
  const { appointments, fetchAppointments } = useAppointments();
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expanded, setExpanded] = useState({}); // đơn đã thu gọn mà người dùng mở ra xem lại

  useEffect(() => {
    fetchMedications();
    fetchAppointments().catch(() => {}); // chỉ để hiện lời dặn / ngày tái khám, lỗi thì bỏ qua
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupByPrescription(medications || []);
  const firstCollapsed = groups.findIndex((g) => g.status === 'collapsed');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.title} tour-step-6`}>Tủ thuốc</h1>
        <button type="button" className={styles.addBtn} onClick={() => setShowAddChoice(true)}>
          <Plus size={22} aria-hidden="true" /> Thêm thuốc
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>{t.common.loading}</p>
      ) : groups.length === 0 ? (
        <EmptyState icon={Pill} title="Tủ thuốc đang trống" subtitle="Bấm Thêm thuốc để quét đơn hoặc nhập tay." />
      ) : (
        <div className={styles.list}>
          {groups.map((group, i) => {
            const collapsed = group.status === 'collapsed' && !expanded[group.key];
            return (
              <section key={group.key} className={styles.prescription} aria-label={`Đơn thuốc ${group.number}`}>
                {i === firstCollapsed && <h2 className={styles.doneHeading}>Đơn đã uống xong</h2>}
                <button
                  type="button"
                  className={`${styles.prescriptionHead} ${group.status !== 'active' ? styles.doneHead : ''}`}
                  onClick={() => (collapsed ? setExpanded((e) => ({ ...e, [group.key]: true })) : setSelectedGroup(group))}
                  aria-expanded={group.status === 'collapsed' ? !collapsed : undefined}
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
                  {collapsed
                    ? <ChevronDown size={22} className={styles.chevron} aria-hidden="true" />
                    : <ChevronRight size={22} className={styles.chevron} aria-hidden="true" />}
                </button>
                {!collapsed && (
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
