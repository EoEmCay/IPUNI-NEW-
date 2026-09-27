import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, Camera, PenLine, ChevronRight } from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { useAppointments } from '../../hooks/useAppointments';
import { useT } from '../../hooks/useT';
import { withDoctorPrefix } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import MedicationTile, { MedicationGrid } from '../../components/medications/MedicationTile';
import MedicationDetailModal from '../../components/medications/MedicationDetailModal';
import MedicationFormModal from '../../components/medications/MedicationFormModal';
import PrescriptionInfoModal from '../../components/medications/PrescriptionInfoModal';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import styles from './MedicationsPage.module.css';

// Mỗi đơn thuốc 1 màu để thuốc của đơn này nhìn khác thuốc của đơn kia.
const PRESCRIPTION_COLORS = [
  { c: '#1B5FA6', soft: '#E8F0FA' }, // xanh dương
  { c: '#0F766E', soft: '#E0F2EF' }, // xanh ngọc
  { c: '#7C3AED', soft: '#F1EAFE' }, // tím
  { c: '#C2410C', soft: '#FDEDE4' }, // cam
  { c: '#BE185D', soft: '#FCE7F1' }, // hồng
  { c: '#15803D', soft: '#E4F5EA' }, // xanh lá
];

// Gom thuốc theo đơn (bác sĩ + ngày kê). Đánh số/màu theo thứ tự thời gian (đơn cũ nhất = Đơn 1)
// để thêm đơn mới không làm đổi màu các đơn đã có; hiển thị đơn mới nhất lên trước.
function groupByPrescription(medications = []) {
  const byKey = {};
  medications.forEach((med) => {
    const date = med.prescribed_at || med.created_at;
    const key = `${med.doctor_name || ''}_${date ? new Date(date).toLocaleDateString('vi-VN') : ''}`;
    byKey[key] ||= { key, doctor_name: med.doctor_name, prescribed_at: date, next_appointment_date: null, medications: [] };
    if (med.next_appointment_date) byKey[key].next_appointment_date = med.next_appointment_date;
    byKey[key].medications.push(med);
  });
  const oldestFirst = Object.values(byKey).sort((a, b) => new Date(a.prescribed_at || 0) - new Date(b.prescribed_at || 0));
  oldestFirst.forEach((g, i) => { g.number = i + 1; g.color = PRESCRIPTION_COLORS[i % PRESCRIPTION_COLORS.length]; });
  return oldestFirst.reverse();
}

export default function MedicationsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { medications, loading, fetchMedications } = useMedications();
  const { appointments, fetchAppointments } = useAppointments();
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchMedications();
    fetchAppointments().catch(() => {}); // chỉ để hiện lời dặn / ngày tái khám, lỗi thì bỏ qua
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupByPrescription(medications || []);

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
          {groups.map((group) => (
            <section key={group.key} className={styles.prescription} aria-label={`Đơn thuốc ${group.number}`}>
              <button type="button" className={styles.prescriptionHead} onClick={() => setSelectedGroup(group)}>
                <span className={styles.badge} style={{ background: group.color.c }}>Đơn {group.number}</span>
                <span className={styles.headText}>
                  <span className={styles.headTitle}>
                    {group.prescribed_at ? `Ngày ${formatDateVN(group.prescribed_at)}` : 'Thuốc tự thêm'}
                  </span>
                  <span className={styles.headSub}>
                    {group.doctor_name ? withDoctorPrefix(group.doctor_name) : 'Không có bác sĩ kê đơn'}
                    {group.next_appointment_date && ` · Tái khám ${formatDateVN(group.next_appointment_date)}`}
                  </span>
                </span>
                <ChevronRight size={22} className={styles.chevron} aria-hidden="true" />
              </button>
              <MedicationGrid>
                {group.medications.map((m) => (
                  <MedicationTile key={m.id} medication={m} accent={group.color} onClick={() => setSelectedMed(m)} />
                ))}
              </MedicationGrid>
            </section>
          ))}
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
        <PrescriptionInfoModal group={selectedGroup} appointments={appointments || []} onClose={() => setSelectedGroup(null)} />
      )}
    </div>
  );
}
