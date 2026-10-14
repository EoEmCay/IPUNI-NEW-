import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  CheckCircle2,
  Clock,
  Camera,
  RotateCcw,
  Check,
  Lock,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { extractMedicationTimes } from '../../utils/medicationTime';
import useRoleModeStore from '../../store/roleModeStore';
import useMedicationsStore from '../../store/medicationsStore';
import { getIntakeLogs, recordMedicationIntake } from '../../store/medicationAdherenceStore';
import { careService } from '../../services/care.service';
import styles from './CaregiverMedicationChecklist.module.css';

const DEFAULT_SLOTS = [
  {
    id: 'med_slot_1',
    medId: 101,
    medication: { id: 101, name: 'Glucophage 500mg (Metformin)', dosage: '1 viên' },
    name: 'Glucophage 500mg (Metformin)',
    dosage: '1 viên',
    instruction: 'Uống ngay sau bữa ăn sáng',
    time: '07:30',
    period: 'Sáng',
  },
  {
    id: 'med_slot_2',
    medId: 102,
    medication: { id: 102, name: 'Amlodipine 5mg', dosage: '1 viên' },
    name: 'Amlodipine 5mg',
    dosage: '1 viên',
    instruction: 'Uống hạ áp cố định đầu ngày',
    time: '08:00',
    period: 'Sáng',
  },
  {
    id: 'med_slot_afternoon',
    medId: 103,
    medication: { id: 103, name: 'Nicorandil 5mg', dosage: '1 viên' },
    name: 'Nicorandil 5mg',
    dosage: '1 viên',
    instruction: 'Uống sau ăn trưa / chiều để ngừa đau thắt ngực',
    time: '15:00',
    period: 'Chiều',
  },
  {
    id: 'med_slot_3',
    medId: 101,
    medication: { id: 101, name: 'Glucophage 500mg (Metformin)', dosage: '1 viên' },
    name: 'Glucophage 500mg (Metformin)',
    dosage: '1 viên',
    instruction: 'Uống ngay sau bữa ăn tối',
    time: '18:30',
    period: 'Tối',
  },
];

export default function CaregiverMedicationChecklist() {
  const navigate = useNavigate();
  const { todayMedications, fetchToday } = useMedications();
  const caregiverData = useRoleModeStore((s) => s.caregiverData);
  const setCaregiverSlotTaken = useRoleModeStore((s) => s.setCaregiverSlotTaken);
  const undoCaregiverSlot = useRoleModeStore((s) => s.undoCaregiverSlot);
  const statusVersion = useMedicationsStore((s) => s.statusVersion);

  const [syncTick, setSyncTick] = useState(0);

  // Khung giờ thực tế: từ 12:00 trở đi là đầu giờ chiều
  const currentHour = new Date().getHours();
  const isAfternoon = currentHour >= 12;

  // Cữ chính theo khung giờ: Chiều nếu qua đầu giờ chiều, Sáng nếu trước 12:00
  const defaultPeriodName = isAfternoon ? 'Chiều' : 'Sáng';
  const [activeFilter, setActiveFilter] = useState(defaultPeriodName);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [activeSlotForPhoto, setActiveSlotForPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Lắng nghe sự kiện đồng bộ chéo giữa các vai trò & các tab/thiết bị
  useEffect(() => {
    const handleSync = () => {
      setSyncTick((t) => t + 1);
      fetchToday();
    };
    window.addEventListener('medicationIntakeChanged', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('medicationIntakeChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchToday]);

  // Chuẩn hóa danh sách cữ thuốc (đọc đầy đủ từ mảng times hoặc chỉ định liều dùng)
  const slots = useMemo(() => {
    if (todayMedications && todayMedications.length > 0) {
      const items = [];
      todayMedications.forEach((med) => {
        const times = extractMedicationTimes(med);
        const resolvedTimes = times.length > 0 ? times : ['08:00'];
        resolvedTimes.forEach((tStr, idx) => {
          const hour = parseInt(tStr.split(':')[0], 10);
          const period = hour < 12 ? 'Sáng' : hour < 14 ? 'Trưa' : hour < 18 ? 'Chiều' : 'Tối';
          items.push({
            id: `${med.id || 'med'}_slot_${idx}_${tStr.replace(':', '')}`,
            medId: med.id,
            medication: med,
            name: med.name || 'Thuốc điều trị',
            dosage: med.dosage || '1 viên',
            instruction: med.instructions || 'Uống theo chỉ dẫn của bác sĩ',
            time: tStr,
            period,
          });
        });
      });
      return items;
    }
    return DEFAULT_SLOTS;
  }, [todayMedications]);

  const intakeLogs = useMemo(() => getIntakeLogs(), [syncTick, statusVersion]);
  const checklistLogs = caregiverData?.checklistLogs || {};

  // Hàm xác định trạng thái uống thuốc đồng bộ từ cả 2 nguồn (Hộ lý + Bệnh nhân/Người con)
  const getSlotIntakeInfo = (slot) => {
    const logFromCaregiver = checklistLogs[slot.id];
    const logFromAdherence = (intakeLogs || []).find(
      (l) =>
        String(l.medicationId) === String(slot.medId) &&
        (l.slotTime === slot.time || l.slotKey === slot.time)
    );

    const isTaken = Boolean(logFromCaregiver?.taken || logFromAdherence?.status === 'taken');
    const takenAt = logFromCaregiver?.takenAt || logFromAdherence?.takenAt || slot.time;
    const photoProof = logFromCaregiver?.photoProof || null;
    const actor = logFromCaregiver?.by || (logFromAdherence?.status === 'taken' ? 'Bệnh nhân' : null);

    return { isTaken, takenAt, photoProof, actor };
  };

  const totalCount = slots.length;
  const takenCount = slots.filter((s) => getSlotIntakeInfo(s).isTaken).length;
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Lọc ra các cữ THỰC SỰ có thuốc (không bao giờ để cữ có số 0)
  const availablePeriods = useMemo(() => {
    const periodOrder = ['Sáng', 'Trưa', 'Chiều', 'Tối'];
    const countMap = {};
    slots.forEach((s) => {
      countMap[s.period] = (countMap[s.period] || 0) + 1;
    });
    return periodOrder
      .filter((p) => (countMap[p] || 0) > 0)
      .map((p) => ({
        name: p,
        count: countMap[p],
      }));
  }, [slots]);

  // Tự động chuyển cữ chính khi qua khung giờ chiều hoặc sáng
  useEffect(() => {
    if (availablePeriods.length > 0) {
      const preferred = availablePeriods.find((p) => p.name === defaultPeriodName);
      if (preferred) {
        setActiveFilter(preferred.name);
      } else if (activeFilter !== 'all' && !availablePeriods.some((p) => p.name === activeFilter)) {
        setActiveFilter(availablePeriods[0].name);
      }
    }
  }, [availablePeriods, defaultPeriodName]);

  // Lọc theo khung giờ
  const filteredSlots = useMemo(() => {
    if (activeFilter === 'all') return slots;
    return slots.filter((s) => s.period === activeFilter);
  }, [slots, activeFilter]);

  // Xử lý xác nhận uống thuốc có đồng bộ chéo 2 chiều
  const handleConfirmTaken = (slot, photoProof = null) => {
    setCaregiverSlotTaken(slot.id, photoProof);

    if (slot.medication) {
      recordMedicationIntake(slot.medication, 'taken', new Date(), null, slot.time);
    }

    if (slot.medId) {
      careService
        .logDose({
          medication_id: slot.medId,
          slot: slot.time,
          status: 'taken',
          taken_at: new Date().toISOString(),
        })
        .catch(() => {});
    }

    setSyncTick((t) => t + 1);
  };

  const handleUndoSlot = (slot) => {
    undoCaregiverSlot(slot.id);
    if (slot.medication) {
      recordMedicationIntake(slot.medication, 'pending', new Date(), null, slot.time);
    }
    setSyncTick((t) => t + 1);
  };

  // Xử lý chụp / chọn ảnh
  const handleTriggerUpload = (slot) => {
    setActiveSlotForPhoto(slot);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlotForPhoto) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      handleConfirmTaken(activeSlotForPhoto, dataUrl);
      setActiveSlotForPhoto(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={styles.container}>
      {/* Ẩn file input để camera / chọn ảnh */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header Gọn Gàng */}
      <header className={styles.headerCompact}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.roleTag}>
              <Pill size={14} /> THUỐC HÔM NAY
            </span>
            <span className={styles.headerCountBadge}>
              Đã uống {takenCount}/{totalCount} cữ ({percent}%)
            </span>
          </div>

          <button
            type="button"
            className={styles.roleSwitchBtn}
            onClick={() => navigate('/scan')}
            style={{
              background: '#ffffff',
              color: '#b45309',
              fontWeight: 800,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={14} /> Quét đơn thuốc mới
          </button>
        </div>
      </header>

      {/* Bộ lọc cữ thuốc: CHỈ hiển thị các cữ thực tế có thuốc */}
      {availablePeriods.length > 0 && (
        <div className={styles.filterRow}>
          {availablePeriods.length > 1 && (
            <button
              type="button"
              className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Tất cả ({totalCount})
            </button>
          )}
          {availablePeriods.map((p) => {
            const isPActive = activeFilter === p.name;
            const isPPast = isAfternoon && p.name === 'Sáng';
            const isPLocked = !isAfternoon && (p.name === 'Chiều' || p.name === 'Tối');

            return (
              <button
                key={p.name}
                type="button"
                className={`${styles.filterBtn} ${
                  isPActive ? styles.filterBtnActive : ''
                } ${isPPast ? styles.filterBtnPast : ''} ${
                  isPLocked ? styles.filterBtnLocked : ''
                }`}
                onClick={() => setActiveFilter(p.name)}
              >
                {isPLocked && <Lock size={12} style={{ marginRight: 3, verticalAlign: -1 }} />}
                Cữ {p.name} ({p.count})
                {isPPast && ' (Đã qua)'}
              </button>
            );
          })}
        </div>
      )}

      {/* Danh sách cữ thuốc */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Clock size={18} color="#d97706" />
            Checklist Cữ Uống Thuốc
          </h2>
          <span className={styles.sectionBadge}>
            {isAfternoon ? 'Đầu giờ chiều' : 'Buổi sáng'}
          </span>
        </div>

        <div className={styles.slotList}>
          {filteredSlots.map((slot) => {
            const { isTaken, takenAt, photoProof, actor } = getSlotIntakeInfo(slot);
            const isLocked = !isAfternoon && (slot.period === 'Chiều' || slot.period === 'Tối');
            const isPast = isAfternoon && slot.period === 'Sáng';

            return (
              <div
                key={slot.id}
                className={`${styles.slotCard} ${
                  isTaken
                    ? styles.slotCardTaken
                    : isLocked
                    ? styles.slotCardLocked
                    : isPast
                    ? styles.slotCardPast
                    : ''
                }`}
              >
                <div className={styles.slotHead}>
                  <span
                    className={`${styles.timeBadge} ${
                      isTaken
                        ? styles.timeBadgeTaken
                        : isLocked
                        ? styles.timeBadgeLocked
                        : isPast
                        ? styles.timeBadgePast
                        : ''
                    }`}
                  >
                    {isLocked ? <Lock size={12} /> : <Clock size={13} />} {slot.time} ({slot.period})
                  </span>
                  <span
                    className={`${styles.statusPill} ${
                      isTaken
                        ? styles.statusDone
                        : isLocked
                        ? styles.statusLocked
                        : isPast
                        ? styles.statusPast
                        : styles.statusPending
                    }`}
                  >
                    {isTaken
                      ? 'Đã uống'
                      : isLocked
                      ? 'Chưa tới giờ'
                      : isPast
                      ? 'Quá giờ sáng'
                      : 'Chưa uống'}
                  </span>
                </div>

                <div>
                  <h3 className={styles.medName}>
                    {slot.name} · {slot.dosage}
                  </h3>
                  <p className={styles.medInstruction}>{slot.instruction}</p>
                </div>

                {isTaken ? (
                  <div className={styles.takenProofRow}>
                    <div className={styles.takenProofText}>
                      <CheckCircle2 size={16} />
                      <span>
                        {actor ? `${actor} xác nhận lúc ` : 'Đã uống lúc '}
                        {takenAt}
                      </span>
                    </div>

                    {photoProof && (
                      <img
                        src={photoProof}
                        alt="Ảnh xác nhận"
                        className={styles.proofThumb}
                        onClick={() => setModalPhoto(photoProof)}
                        title="Bấm để xem ảnh lớn"
                      />
                    )}

                    <button
                      type="button"
                      className={styles.btnUndo}
                      onClick={() => handleUndoSlot(slot)}
                      title="Hoàn tác lại cữ này"
                    >
                      <RotateCcw size={12} /> Hoàn tác
                    </button>
                  </div>
                ) : isLocked ? (
                  <div className={styles.lockedRow}>
                    <div className={styles.lockedNotice}>
                      <Lock size={14} color="#b45309" />
                      <span>Chưa tới cữ {slot.period.toLowerCase()}</span>
                    </div>
                  </div>
                ) : isPast ? (
                  <div className={styles.actionRowPast}>
                    <button
                      type="button"
                      className={styles.btnConfirmPast}
                      onClick={() => handleConfirmTaken(slot)}
                    >
                      <Check size={15} /> Uống bù cữ sáng
                    </button>
                    <button
                      type="button"
                      className={styles.btnPhotoPast}
                      onClick={() => handleTriggerUpload(slot)}
                    >
                      <Camera size={14} /> Chụp ảnh
                    </button>
                  </div>
                ) : (
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.btnConfirm}
                      onClick={() => handleConfirmTaken(slot)}
                    >
                      <Check size={16} /> Xác nhận đã uống
                    </button>
                    <button
                      type="button"
                      className={styles.btnPhoto}
                      onClick={() => handleTriggerUpload(slot)}
                    >
                      <Camera size={15} /> Chụp ảnh
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal xem ảnh phóng to */}
      {modalPhoto && (
        <div className={styles.modalOverlay} onClick={() => setModalPhoto(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Ảnh Xác Nhận Cữ Thuốc</h3>
            <img src={modalPhoto} alt="Minh chứng cữ thuốc" className={styles.modalImg} />
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setModalPhoto(null)}
            >
              Đóng xem ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
