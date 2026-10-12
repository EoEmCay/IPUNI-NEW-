import { useState } from 'react';
import { Pill, Syringe, Clock, Calendar, CheckSquare, Lock } from 'lucide-react';
import Modal from '../common/Modal';
import { withDoctorPrefix } from '../../utils/doctor';
import { exportMedicationToCalendar } from '../../utils/calendar';
import { extractMedicationTimes } from '../../utils/medicationTime';
import { medicationsService } from '../../services/medications.service';
import { isInjection } from '../../utils/medForm';
import { PERIOD_DEFS, inferDoctorPeriods, clampTimeToPeriod, classifyTimeToPeriod } from '../scan/SmartScheduleStep';
import DrugPhotoPicker from './DrugPhotoPicker';
import styles from './MedicationDetailModal.module.css';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export default function MedicationDetailModal({ medication, onClose }) {
  const med = medication || {};
  const doctorPeriods = inferDoctorPeriods(med);
  const initialTimes = extractMedicationTimes(med);

  // Ánh xạ giờ hiện tại của thuốc vào đúng các cử cố định của bác sĩ
  const [periodClock, setPeriodClock] = useState(() => {
    const map = {
      morning: '07:00',
      afternoon: '15:00',
      evening: '18:30',
    };
    initialTimes.forEach((t) => {
      const p = classifyTimeToPeriod(t);
      map[p] = clampTimeToPeriod(p, t);
    });
    return map;
  });

  const [currentTimes, setCurrentTimes] = useState(() =>
    doctorPeriods.map((p) => periodClock[p])
  );
  const [isEditingTimes, setIsEditingTimes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const prescribedAt = med.prescribed_at
    ? new Date(med.prescribed_at).toLocaleDateString('vi-VN')
    : null;

  const isMobile = window.innerWidth < 768;

  const handleSaveTimes = async () => {
    setIsSaving(true);
    try {
      const timesArr = doctorPeriods.map((p) => clampTimeToPeriod(p, periodClock[p]));
      await medicationsService.update(med.id, {
        times: timesArr,
      });

      setCurrentTimes(timesArr);
      setIsEditingTimes(false);
      med.times = timesArr;
    } catch (err) {
      alert('Có lỗi khi lưu giờ: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleCalendar = () => {
    const text = encodeURIComponent(`Uống thuốc: ${med.name}`);
    const details = encodeURIComponent(`Liều dùng: ${med.dosage}\nCách dùng: ${med.frequency}\nChỉ dẫn: ${med.instructions}`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
    window.open(url, '_blank');
  };

  const handleNotionCalendar = () => {
    window.open('https://calendar.notion.so', '_blank');
  };

  return (
    <Modal title="Chi tiết thuốc & Hình ảnh nhận diện" onClose={onClose}>
      <div className={styles.hero}>
        <div className={styles.imgWrap}>
          {med.image ? (
            <img src={med.image} alt={med.name} className={styles.img} draggable={false} />
          ) : (
            isInjection(med) ? <Syringe size={32} color="#1B5FA6" /> : <Pill size={32} color="#1B5FA6" />
          )}
        </div>
        <div>
          <div className={styles.name}>{med.name}</div>
          {med.dosage && <div className={styles.dosage}>{med.dosage}</div>}
        </div>
      </div>

      <DrugPhotoPicker drugName={med.name} />

      <div className={styles.section}>
        <Row label="Tên đầy đủ" value={med.full_name || med.name} />
        <Row label="Xuất xứ" value={med.origin} />
        <Row label="Tác dụng chính" value={med.main_effect} />
        <Row label="Cách dùng" value={med.instructions} />
        <Row label="Tác dụng phụ" value={med.side_effects} />
        <Row label="Liều dùng" value={[med.dosage, med.frequency].filter(Boolean).join(' · ')} />
        <Row label="Bác sĩ kê đơn" value={med.doctor_name ? withDoctorPrefix(med.doctor_name) : null} />
        <Row label="Ngày kê đơn" value={prescribedAt} />
      </div>

      {/* ── Chỉnh sửa khung giờ uống trong cử cố định của bác sĩ ── */}
      <div className={styles.section} style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0', marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} color="#2563EB" /> Cử & Khung giờ uống thuốc
          </div>
          {!isEditingTimes ? (
            <button 
              onClick={() => setIsEditingTimes(true)}
              style={{ fontSize: 14, color: '#2563EB', background: 'white', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
            >
              Đổi khung giờ
            </button>
          ) : (
            <button 
              onClick={() => setIsEditingTimes(false)}
              style={{ fontSize: 14, color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Đóng
            </button>
          )}
        </div>

        {!isEditingTimes ? (
          <div className={styles.timeList}>
            {doctorPeriods.map((pKey, i) => {
              const pDef = PERIOD_DEFS.find((d) => d.key === pKey);
              const tm = currentTimes[i] || periodClock[pKey];
              return (
                <div key={pKey} className={styles.timeItem}>
                  <Clock size={14} color="#1B5FA6" /> {pDef?.label}: <strong>{tm}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Lock size={13} color="#2563EB" />
              <span>Cử uống được giữ cố định theo đơn bác sĩ. Chỉ thay đổi giờ trong khung quy định:</span>
            </div>

            {doctorPeriods.map((pKey) => {
              const pDef = PERIOD_DEFS.find((d) => d.key === pKey);
              if (!pDef) return null;
              return (
                <div
                  key={pKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: pDef.bg,
                    border: `1.5px solid ${pDef.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      {pDef.icon} {pDef.label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      Khung cố định: {pDef.rangeLabel}
                    </div>
                  </div>

                  <select
                    value={periodClock[pKey]}
                    onChange={(e) =>
                      setPeriodClock((prev) => ({
                        ...prev,
                        [pKey]: clampTimeToPeriod(pKey, e.target.value),
                      }))
                    }
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: pDef.accent,
                      background: '#FFFFFF',
                      border: `2px solid ${pDef.accent}`,
                      borderRadius: 10,
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {pDef.slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <button
              onClick={handleSaveTimes}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '10px',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu khung giờ uống'}
            </button>
          </div>
        )}
      </div>

      {isMobile ? (
        <button 
          className={styles.calendarBtn} 
          onClick={() => exportMedicationToCalendar(med)}
        >
          <Calendar size={16} /> Thêm lịch nhắc vào điện thoại
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            className={styles.calendarBtn} 
            onClick={handleGoogleCalendar}
            style={{ flex: 1, background: '#4285F4', color: 'white' }}
          >
            <Calendar size={16} /> Google Calendar
          </button>
          <button 
            className={styles.calendarBtn} 
            onClick={handleNotionCalendar}
            style={{ flex: 1, background: '#111111', color: 'white' }}
          >
            <CheckSquare size={16} /> Notion Calendar
          </button>
        </div>
      )}
    </Modal>
  );
}
