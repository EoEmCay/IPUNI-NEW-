import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  Pill,
  Syringe,
  X,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { INSULIN_PATTERN } from '../../utils/medForm';
import {
  DAYS,
  PERIODS,
  inferPeriodsForMed,
  inferDaysForMed,
  syncMedicationsFromMatrix,
  saveMatrixToStorage,
  loadMatrixFromStorage
} from '../../utils/smartMatrix';
import styles from './SmartPillMatrix.module.css';

export { DAYS, PERIODS, inferPeriodsForMed, inferDaysForMed };

export default function SmartPillMatrix({
  medications = [],
  isScanReview = false,
  onConfirm = null,
  onChange = null,
  readOnly = false,
}) {
  // Trạng thái lưu trữ thuốc trong 28 ngăn: { [cellKey]: [medIndex1, medIndex2, ...] }
  // cellKey dạng "mon_morning", "tue_evening", etc.
  const [matrixData, setMatrixData] = useState(() => {
    if (!isScanReview) {
      const saved = loadMatrixFromStorage(medications);
      if (saved) return saved;
    }

    const initial = {};
    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        initial[`${d.key}_${p.key}`] = [];
      });
    });

    (medications || []).forEach((med, medIndex) => {
      const pKeys = inferPeriodsForMed(med);
      const dKeys = inferDaysForMed(med);
      dKeys.forEach((d) => {
        pKeys.forEach((p) => {
          const key = `${d}_${p}`;
          if (initial[key] && !initial[key].includes(medIndex)) {
            initial[key].push(medIndex);
          }
        });
      });
    });

    return initial;
  });

  // Giờ của 4 buổi
  const [periodTimes, setPeriodTimes] = useState({
    morning: '07:00',
    noon: '12:00',
    afternoon: '15:00',
    evening: '19:00',
  });

  // Modal chỉnh sửa ô đang chọn
  const [activeCellKey, setActiveCellKey] = useState(null);
  const [editingMedIndices, setEditingMedIndices] = useState([]);

  // Tự động đồng bộ lại khi `medications` thay đổi nếu chưa có dữ liệu lưu
  useEffect(() => {
    if (!isScanReview) {
      const saved = loadMatrixFromStorage(medications);
      if (saved) {
        setMatrixData(saved);
        return;
      }
    }

    const updated = {};
    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        updated[`${d.key}_${p.key}`] = [];
      });
    });

    (medications || []).forEach((med, medIndex) => {
      const pKeys = inferPeriodsForMed(med);
      const dKeys = inferDaysForMed(med);
      dKeys.forEach((d) => {
        pKeys.forEach((p) => {
          const key = `${d}_${p}`;
          if (updated[key] && !updated[key].includes(medIndex)) {
            updated[key].push(medIndex);
          }
        });
      });
    });

    setMatrixData(updated);
  }, [medications, isScanReview]);

  // Xác định ngày hôm nay để highlight cột
  const todayDayKey = useMemo(() => {
    const d = new Date().getDay();
    const found = DAYS.find((item) => item.dayIndex === d);
    return found ? found.key : 'mon';
  }, []);

  // Mở modal chỉnh sửa ô khi người dùng muốn tự tay thay đổi lịch
  const handleCellClick = (cellKey) => {
    if (readOnly) return;
    setActiveCellKey(cellKey);
    setEditingMedIndices([...(matrixData[cellKey] || [])]);
  };

  const handleToggleMedInCell = (medIndex) => {
    setEditingMedIndices((prev) =>
      prev.includes(medIndex) ? prev.filter((i) => i !== medIndex) : [...prev, medIndex]
    );
  };

  // Lưu thuốc vào ô này
  const handleSaveCell = () => {
    if (!activeCellKey) return;
    const nextMatrix = {
      ...matrixData,
      [activeCellKey]: editingMedIndices,
    };
    setMatrixData(nextMatrix);
    setActiveCellKey(null);

    // Lưu ngay vào localStorage nếu không phải chế độ xem thử đơn quét
    if (!isScanReview) {
      saveMatrixToStorage(nextMatrix, medications);
    }

    const syncedMeds = syncMedicationsFromMatrix(medications, nextMatrix, periodTimes);

    if (onChange) {
      onChange(nextMatrix, syncedMeds);
    }
  };

  // Xác nhận chấp thuận (Bấm "Ok")
  const handleConfirmAll = useCallback(() => {
    const syncedMeds = syncMedicationsFromMatrix(medications, matrixData, periodTimes);

    if (!isScanReview) {
      saveMatrixToStorage(matrixData, medications);
    }

    if (onConfirm) {
      onConfirm(syncedMeds, matrixData, periodTimes);
    }
  }, [medications, matrixData, periodTimes, onConfirm, isScanReview]);

  const activeCellMeta = useMemo(() => {
    if (!activeCellKey) return null;
    const [dKey, pKey] = activeCellKey.split('_');
    const day = DAYS.find((d) => d.key === dKey);
    const period = PERIODS.find((p) => p.key === pKey);
    return { day, period };
  }, [activeCellKey]);

  return (
    <div className={styles.matrixContainer} aria-label="Hộp thuốc thông minh 7x4 CalenDIA+">
      {/* ── BANNER AI & NÚT OK DUYỆT LỊCH ── */}
      {isScanReview && (
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <Sparkles size={24} className={styles.bannerIcon} />
            <div>
              <h3 className={styles.bannerTitle}>
                AI đã tự động xếp {medications.length} loại thuốc vào 28 ngăn kéo theo đơn bác sĩ
              </h3>
              <p className={styles.bannerDesc}>
                Các thuốc cùng buổi được gom vào cùng 1 ô. Nếu đồng ý bấm <strong>"Ok"</strong>, hoặc chạm vào từng ô để tự chọn lại.
              </p>
            </div>
          </div>
          {onConfirm && (
            <button
              type="button"
              className={styles.okBtn}
              onClick={handleConfirmAll}
              aria-label="Đồng ý xếp lịch"
            >
              <Check size={18} strokeWidth={3} />
              <span>Ok (Đồng ý)</span>
            </button>
          )}
        </div>
      )}

      {/* ── THANH ĐIỀU KHIỂN & CHỈ DẪN ── */}
      <div className={styles.controlsBar}>
        <div className={styles.deviceModelBadge}>
          <Layers size={14} color="#F59E0B" />
          <span>Mô hình CalenDIA+ 28 ngăn (7 ngày x 4 buổi)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569' }}>
          <Edit3 size={14} color="#F59E0B" />
          <span>Chạm vào ô để chỉnh sửa/thêm thuốc vào ô</span>
        </div>
      </div>

      <div className={styles.mobileScrollHint} aria-hidden="true">
        ↔ Vuốt hoặc cuộn ngang để xem đủ 7 ngày (Thứ Hai → Chủ Nhật)
      </div>

      {/* ── VÙNG CUỘN MA TRẬN 7x4 (28 NGĂN KÉO) ── */}
      <div className={styles.scrollWrapper}>
        <div className={styles.matrixGrid}>
          {/* Ô góc trên bên trái */}
          <div className={styles.cornerCell}>Buổi \ Ngày</div>

          {/* 7 cột ngày trong tuần */}
          {DAYS.map((day) => {
            const isToday = day.key === todayDayKey;
            const isSunday = day.key === 'sun';
            return (
              <div
                key={day.key}
                className={`${styles.headerCell} ${isToday ? styles.headerCellToday : ''} ${
                  isSunday && !isToday ? styles.headerCellSunday : ''
                }`}
              >
                <div className={styles.headerDayName}>{day.label}</div>
                <div className={styles.headerDaySub}>
                  {isToday ? 'Hôm nay' : day.short}
                </div>
              </div>
            );
          })}

          {/* 4 hàng buổi trong ngày (Sáng, Trưa, Chiều, Tối) */}
          {PERIODS.map((period) => (
            <div key={`row-${period.key}`} style={{ display: 'contents' }}>
              {/* Cột tiêu đề hàng (Buổi) */}
              <div className={styles.periodHeaderCell}>
                <div className={styles.periodName}>{period.label}</div>
                <div className={styles.periodTimeBadge}>{periodTimes[period.key]}</div>
              </div>

              {/* 7 ngăn kéo của hàng này ứng với 7 ngày */}
              {DAYS.map((day) => {
                const cellKey = `${day.key}_${period.key}`;
                const medIndices = matrixData[cellKey] || [];
                const cellMeds = medIndices.map((idx) => medications[idx]).filter(Boolean);
                const hasMeds = cellMeds.length > 0;

                return (
                  <div
                    key={cellKey}
                    tabIndex={0}
                    role="button"
                    className={`${styles.drawerCell} ${hasMeds ? styles.drawerCellActive : ''}`}
                    onClick={() => handleCellClick(cellKey)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCellClick(cellKey)}
                    title={`Ngăn kéo ${day.label} - ${period.label}: ${
                      hasMeds ? cellMeds.map((m) => m.name).join(', ') : 'Trống'
                    } (Chạm để chỉnh sửa)`}
                  >
                    {/* Danh sách thuốc trong ngăn này */}
                    {!hasMeds ? (
                      <div className={styles.drawerEmpty}>Ô trống</div>
                    ) : (
                      <div className={styles.pillsList}>
                        {cellMeds.slice(0, 3).map((med, mIdx) => {
                          const isInject = INSULIN_PATTERN.test(med.name || '');
                          return (
                            <div key={`${cellKey}-${mIdx}`} className={styles.pillBadge}>
                              <div className={styles.pillBadgeTop}>
                                {isInject ? (
                                  <Syringe size={12} className={styles.pillIconInject} />
                                ) : (
                                  <Pill size={12} className={styles.pillIconOral} />
                                )}
                                <span className={styles.pillName} title={med.name}>
                                  {med.name}
                                </span>
                              </div>
                              <div className={styles.pillDosage}>
                                {med.dosage || '1 liều'}
                              </div>
                            </div>
                          );
                        })}
                        {cellMeds.length > 3 ? (
                          <div className={styles.morePillsBadge} title="Chạm vào ô để xem tất cả thuốc">
                            <Layers size={11} /> +{cellMeds.length - 3} thuốc khác
                          </div>
                        ) : cellMeds.length > 1 ? (
                          <div className={styles.multipleMedsCount}>
                            <Layers size={10} /> {cellMeds.length} thuốc cùng cữ
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Lẫy kéo ngăn thuốc CalenDIA+ */}
                    <div className={styles.drawerHandle} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── CHÚ THÍCH PHÍA DƯỚI ── */}
      <div className={styles.footerLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotAmber} />
          <span>Ô có thuốc (phát sáng vàng dịu mắt khi lia chuột)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotEmpty} />
          <span>Ô trống (nghỉ cữ / chưa xếp)</span>
        </div>
        <div className={styles.legendItem}>
          <Pill size={13} color="#0284C7" />
          <span>Thuốc viên</span>
          <Syringe size={13} color="#EA580C" style={{ marginLeft: 6 }} />
          <span>Thuốc tiêm</span>
        </div>
      </div>

      {/* ── POPOVER TÙY CHỈNH THUỐC TRONG 1 Ô ── */}
      {activeCellKey && activeCellMeta && (
        <div className={styles.popoverOverlay} onClick={() => setActiveCellKey(null)}>
          <div className={styles.popoverContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popoverHeader}>
              <h4 className={styles.popoverTitle}>
                <span>
                  Ngăn {activeCellMeta.day?.label} · Buổi {activeCellMeta.period?.label}
                </span>
              </h4>
              <button
                type="button"
                className={styles.popoverCloseBtn}
                onClick={() => setActiveCellKey(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px 0' }}>
              Chọn các loại thuốc bạn muốn uống trong cữ này:
            </p>

            <div className={styles.medCheckboxList}>
              {medications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
                  Chưa có thuốc nào
                </div>
              ) : (
                medications.map((med, medIndex) => {
                  const isChecked = editingMedIndices.includes(medIndex);
                  const isInject = INSULIN_PATTERN.test(med.name || '');

                  return (
                    <div
                      key={`edit-med-${medIndex}`}
                      className={`${styles.medCheckboxItem} ${
                        isChecked ? styles.medCheckboxActive : ''
                      }`}
                      onClick={() => handleToggleMedInCell(medIndex)}
                    >
                      <div
                        className={`${styles.checkboxSquare} ${
                          isChecked ? styles.checkboxSquareActive : ''
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className={styles.medInfoWrap}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isInject ? (
                            <Syringe size={14} className={styles.pillIconInject} />
                          ) : (
                            <Pill size={14} className={styles.pillIconOral} />
                          )}
                          <span className={styles.medItemName}>{med.name}</span>
                        </div>
                        <span className={styles.medItemDosage}>
                          Liều: {med.dosage || 'Theo chỉ định'} · {med.instructions || 'Uống theo đơn'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.popoverFooter}>
              <button
                type="button"
                className={styles.popoverCancelBtn}
                onClick={() => setActiveCellKey(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.popoverConfirmBtn}
                onClick={handleSaveCell}
              >
                Lưu vào ngăn này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
