import { useState } from 'react';
import { Stethoscope, CalendarDays, CalendarClock, NotebookPen, PackageCheck } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix, sameDoctor } from '../../utils/doctor';
import { formatDateVN } from '../../utils/date';
import { medicationsService } from '../../services/medications.service';
import styles from './PrescriptionInfoModal.module.css';

// 'YYYY-MM-DD' của hôm qua theo giờ máy
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Chi tiết 1 đơn thuốc: bác sĩ, ngày khám, ngày tái khám, lời dặn (thay cho tab Bác sĩ cũ).
// Có nút đánh dấu đơn đã uống xong (ngừng nhắc, 7 ngày sau tự thu gọn) hoặc uống tiếp.
export default function PrescriptionInfoModal({ group, appointments = [], onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const visit = appointments.find((a) => sameDoctor(a.doctor_name, group.doctor_name));
  const nextVisit = group.next_appointment_date || visit?.scheduled_at;
  const rows = [
    { icon: Stethoscope, label: 'Bác sĩ kê đơn', value: group.doctor_name ? withDoctorPrefix(group.doctor_name) : 'Không có (thuốc tự thêm)' },
    { icon: CalendarDays, label: 'Ngày khám', value: group.prescribed_at ? formatDateVN(group.prescribed_at) : null },
    { icon: CalendarClock, label: 'Ngày tái khám', value: nextVisit ? formatDateVN(nextVisit) : null },
    { icon: NotebookPen, label: 'Lời dặn của bác sĩ', value: visit?.note || null },
    { icon: PackageCheck, label: group.status === 'active' ? 'Dự kiến hết thuốc' : 'Đã hết thuốc', value: group.endDate ? formatDateVN(group.endDate) : null },
  ].filter((r) => r.value);

  const finished = group.status !== 'active';
  const setEndDate = async (endDate) => {
    const msg = finished
      ? 'Bạn vẫn đang uống đơn này? App sẽ nhắc uống lại các thuốc trong đơn.'
      : 'Đánh dấu đã uống xong đơn này? App sẽ ngừng nhắc các thuốc trong đơn.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      await Promise.all(group.medications.map((m) => medicationsService.update(m.id, { end_date: endDate })));
      onChanged?.();
    } catch {
      setError('Chưa lưu được. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Đơn thuốc ${group.number}`} onClose={onClose}>
      <div className={styles.body}>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.row}>
            <Icon size={22} className={styles.icon} style={{ color: group.color.c }} aria-hidden="true" />
            <div>
              <p className={styles.label}>{label}</p>
              <p className={styles.value}>{value}</p>
            </div>
          </div>
        ))}
        <div className={styles.meds}>
          <p className={styles.label}>{group.medications.length} thuốc trong đơn</p>
          <ul className={styles.medList}>
            {group.medications.map((m) => <li key={m.id}>{m.name}</li>)}
          </ul>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="button" className={styles.finishBtn} disabled={busy}
          onClick={() => setEndDate(finished ? null : yesterdayStr())}>
          {busy ? 'Đang lưu…' : finished ? 'Vẫn đang uống đơn này' : 'Đơn này đã uống xong'}
        </button>
      </div>
    </Modal>
  );
}
