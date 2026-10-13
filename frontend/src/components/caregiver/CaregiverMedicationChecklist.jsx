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
  Lock,
} from 'lucide-react';
import { useMedications } from '../../hooks/useMedications';
import { extractMedicationTimes } from '../../utils/medicationTime';
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
    id: 'med_slot_afternoon',
    name: 'Nicorandil 5mg',
    dosage: '1 viên',
    instruction: 'Uống sau ăn trưa / chiều để ngừa đau thắt ngực',
    time: '15:00',
    period: 'Chiều',
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

  // Mô phỏng / thời gian thực: null = theo đồng hồ máy thật, 'morning' = giả lập sáng, 'afternoon' = giả lập đầu giờ chiều
  const [timeShift, setTimeShift] = useState(null);
  const currentHour = timeShift === 'afternoon' ? 14 : timeShift === 'morning' ? 8 : new Date().getHours();
  // Qua đầu giờ chiều: từ 12:00 trở đi
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

      {/* Thanh hiển thị & mô phỏng khung giờ ca trực */}
      <div className={styles.timeModeBar}>
        <div className={styles.timeModeLabel}>
          <Clock size={13} />
          <span>
            {timeShift === 'afternoon'
              ? 'Đang xem thử nghiệm: Đầu giờ chiều (14:00)'
              : timeShift === 'morning'
              ? 'Đang xem thử nghiệm: Buổi sáng (08:00)'
              : `Khung giờ: ${isAfternoon ? 'Qua đầu giờ chiều (Cữ Chiều chính)' : 'Buổi sáng (Cữ Sáng chính)'}`}
          </span>
        </div>
        <div className={styles.timeShiftBtns}>
          <button
            type="button"
            className={`${styles.timeShiftBtn} ${(!timeShift && !isAfternoon) || timeShift === 'morning' ? styles.timeShiftBtnActive : ''}`}
            onClick={() => setTimeShift('morning')}
            title="Xem giao diện ca sáng: cữ Sáng chính, cữ Chiều bị khóa"
          >
            Ca Sáng
          </button>
          <button
            type="button"
            className={`${styles.timeShiftBtn} ${(!timeShift && isAfternoon) || timeShift === 'afternoon' ? styles.timeShiftBtnActive : ''}`}
            onClick={() => setTimeShift('afternoon')}
            title="Xem giao diện đầu giờ chiều: cữ Chiều chính, cữ Sáng màu xám"
          >
            Ca Chiều
          </button>
          {timeShift && (
            <button
              type="button"
              className={styles.timeShiftBtnReset}
              onClick={() => setTimeShift(null)}
              title="Quay lại khung giờ theo đồng hồ thực tế"
            >
              Theo giờ thật
            </button>
          )}
        </div>
      </div>

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
                {isPLocked && ' (Khoá)'}
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
            const isTaken = !!checklistLogs[slot.id]?.taken;
            const log = checklistLogs[slot.id];
            // Nếu chưa tới cữ chiều/tối thì khóa: "Nếu chưa tới cử chiều thì sẽ khóa, chỉ cho nhìn thôi"
            const isLocked = !isAfternoon && (slot.period === 'Chiều' || slot.period === 'Tối');
            // Cữ sáng khi qua đầu giờ chiều: "còn cử sáng sẽ màu xám không hiện lên chính (theo khung giờ)"
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
                      ? '✓ Đã uống'
                      : isLocked
                      ? '🔒 Chưa tới giờ (Khoá)'
                      : isPast
                      ? '⚠️ Quá giờ sáng'
                      : 'Chưa uống'}
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
                      <span>Đã cho cụ uống lúc {log?.takenAt || slot.time}</span>
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
                ) : isLocked ? (
                  <div className={styles.lockedRow}>
                    <div className={styles.lockedNotice}>
                      <Lock size={14} color="#b45309" />
                      <span>Chưa tới cữ {slot.period.toLowerCase()} · Khoá xác nhận (Chỉ cho nhìn thuốc)</span>
                    </div>
                  </div>
                ) : isPast ? (
                  <div className={styles.actionRowPast}>
                    <button
                      type="button"
                      className={styles.btnConfirmPast}
                      onClick={() => setCaregiverSlotTaken(slot.id)}
                    >
                      <Check size={15} /> Uống bù cữ sáng
                    </button>
                    <button
                      type="button"
                      className={styles.btnPhotoPast}
                      onClick={() => handleTriggerUpload(slot.id)}
                    >
                      <Camera size={14} /> Chụp ảnh
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
