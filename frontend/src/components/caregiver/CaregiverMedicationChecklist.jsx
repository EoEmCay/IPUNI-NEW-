import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  Camera,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import useRoleModeStore from '../../store/roleModeStore';
import RoleCircleSwitcher from '../common/RoleCircleSwitcher';
import styles from './CaregiverMedicationChecklist.module.css';

const DEFAULT_SLOTS = [
  {
    id: 'med_slot_1',
    name: 'Glucophage 500mg (Metformin)',
    dosage: '1 viên',
    instruction: 'Uống ngay sau bữa ăn sáng',
    time: '07:30',
    period: 'Sáng',
  },
  {
    id: 'med_slot_2',
    name: 'Amlodipine 5mg',
    dosage: '1 viên',
    instruction: 'Uống hạ áp cố định đầu ngày',
    time: '08:00',
    period: 'Sáng',
  },
  {
    id: 'med_slot_3',
    name: 'Glucophage 500mg (Metformin)',
    dosage: '1 viên',
    instruction: 'Uống ngay sau bữa ăn tối',
    time: '18:30',
    period: 'Tối',
  },
];

export default function CaregiverMedicationChecklist() {
  const { todayMedications, fetchToday } = useMedications();
  const caregiverData = useRoleModeStore((s) => s.caregiverData);
  const setCaregiverSlotTaken = useRoleModeStore((s) => s.setCaregiverSlotTaken);
  const undoCaregiverSlot = useRoleModeStore((s) => s.undoCaregiverSlot);
  const openRoleSelector = useRoleModeStore((s) => s.openRoleSelector);

  const [activeFilter, setActiveFilter] = useState('all');
  const [modalPhoto, setModalPhoto] = useState(null);
  const [activeSlotForPhoto, setActiveSlotForPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Chuẩn hóa danh sách cữ thuốc
  const slots = useMemo(() => {
    if (todayMedications && todayMedications.length > 0) {
      const items = [];
      todayMedications.forEach((med) => {
        const times =
          Array.isArray(med.schedule_times) && med.schedule_times.length > 0
            ? med.schedule_times
            : ['08:00'];
        times.forEach((tStr, idx) => {
          const hour = parseInt(tStr.split(':')[0], 10);
          const period = hour < 11 ? 'Sáng' : hour < 14 ? 'Trưa' : hour < 18 ? 'Chiều' : 'Tối';
          items.push({
            id: `${med.id || 'med'}_${idx}`,
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

  const checklistLogs = caregiverData?.checklistLogs || {};
  const totalCount = slots.length;
  const takenCount = slots.filter((s) => checklistLogs[s.id]?.taken).length;
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

  // Lọc theo khung giờ
  const filteredSlots = useMemo(() => {
    if (activeFilter === 'all') return slots;
    return slots.filter((s) => s.period === activeFilter);
  }, [slots, activeFilter]);

  // Xử lý chụp / chọn ảnh
  const handleTriggerUpload = (slotId) => {
    setActiveSlotForPhoto(slotId);
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
      setCaregiverSlotTaken(activeSlotForPhoto, dataUrl);
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

      {/* Header Gọn Gàng - Không có khối thông tin bự cụ Nguyễn Văn An */}
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
          <RoleCircleSwitcher />
        </div>
      </header>

      {/* Bộ lọc cữ thuốc: CHỈ hiển thị các cữ thực tế có thuốc, KHÔNG hiển thị cữ (0) */}
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
          {availablePeriods.map((p) => (
            <button
              key={p.name}
              type="button"
              className={`${styles.filterBtn} ${activeFilter === p.name ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(p.name)}
            >
              Cữ {p.name} ({p.count})
            </button>
          ))}
        </div>
      )}

      {/* Danh sách cữ thuốc */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Clock size={18} color="#d97706" />
            Checklist Cữ Uống Thuốc
          </h2>
          <span className={styles.sectionBadge}>Hôm nay</span>
        </div>

        <div className={styles.slotList}>
          {filteredSlots.map((slot) => {
            const isTaken = !!checklistLogs[slot.id]?.taken;
            const log = checklistLogs[slot.id];

            return (
              <div
                key={slot.id}
                className={`${styles.slotCard} ${isTaken ? styles.slotCardTaken : ''}`}
              >
                <div className={styles.slotHead}>
                  <span
                    className={`${styles.timeBadge} ${
                      isTaken ? styles.timeBadgeTaken : ''
                    }`}
                  >
                    <Clock size={13} /> {slot.time} ({slot.period})
                  </span>
                  <span
                    className={`${styles.statusPill} ${
                      isTaken ? styles.statusDone : styles.statusPending
                    }`}
                  >
                    {isTaken ? '✓ Đã uống' : 'Chưa uống'}
                  </span>
                </div>

                <div>
                  <h3 className={styles.medName}>
                    {slot.name} · {slot.dosage}
                  </h3>
                  <p className={styles.medInstruction}>📌 {slot.instruction}</p>
                </div>

                {isTaken ? (
                  <div className={styles.takenProofRow}>
                    <div className={styles.takenProofText}>
                      <CheckCircle2 size={16} />
                      <span>Đã cho cụ uống lúc {log?.takenAt || '08:05'}</span>
                    </div>

                    {log?.photoProof && (
                      <img
                        src={log.photoProof}
                        alt="Ảnh xác nhận"
                        className={styles.proofThumb}
                        onClick={() => setModalPhoto(log.photoProof)}
                        title="Bấm để xem ảnh lớn"
                      />
                    )}

                    <button
                      type="button"
                      className={styles.btnUndo}
                      onClick={() => undoCaregiverSlot(slot.id)}
                      title="Hoàn tác lại cữ này"
                    >
                      <RotateCcw size={12} /> Hoàn tác
                    </button>
                  </div>
                ) : (
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.btnConfirm}
                      onClick={() => setCaregiverSlotTaken(slot.id)}
                    >
                      <Check size={16} /> Xác nhận đã uống
                    </button>
                    <button
                      type="button"
                      className={styles.btnPhoto}
                      onClick={() => handleTriggerUpload(slot.id)}
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
