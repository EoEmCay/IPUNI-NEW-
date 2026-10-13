import React, { useState, useEffect } from 'react';
import careService from '../../services/care.service';
import DoctorReportModal from './DoctorReportModal';
import styles from './CareTimeline.module.css';

export default function CareTimeline({ patientId = null }) {
  const [timelineData, setTimelineData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [doctorReport, setDoctorReport] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tl, wk] = await Promise.all([
        careService.getTimeline(null, patientId),
        careService.getWeeklySummary(patientId),
      ]);
      setTimelineData(tl);
      setWeeklyData(wk);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dòng thời gian chăm sóc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  // Xử lý nút bấm to 1-chạm cho cụ (Option 2B)
  const handleConfirmDose = async (medId, time) => {
    try {
      setActionLoading(true);
      await careService.logDose({
        medication_id: medId,
        scheduled_for: `${timelineData?.date || ''} ${time}:00`,
        status: 'taken',
      });
      await fetchData();
    } catch (err) {
      alert('Không thể ghi nhận: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Mở modal báo cáo bác sĩ (Option 4C)
  const handleOpenDoctorReport = async () => {
    try {
      setActionLoading(true);
      const report = await careService.getDoctorReport(patientId);
      setDoctorReport(report);
      setShowDoctorModal(true);
    } catch (err) {
      alert('Không thể tạo báo cáo bác sĩ: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '30px 0', color: '#6B7280' }}>
        <div>Đang đồng bộ dòng thời gian chăm sóc...</div>
      </div>
    );
  }

  const overallStatus = timelineData?.overall_status || 'stable';
  const isDanger = overallStatus === 'danger';
  const isWarning = overallStatus === 'needs_attention';

  // Lấy text thông điệp thẻ an tâm trên cùng (Option 1A)
  let statusCardClass = styles.statusStable;
  let statusTitle = `${timelineData?.patient_name || 'Bố/Mẹ'} đang an toàn hôm nay`;
  let statusDesc = 'Mọi cữ thuốc và chỉ số đường huyết đều đúng giờ, không có dấu hiệu bất thường.';

  if (isDanger) {
    statusCardClass = styles.statusDanger;
    statusTitle = 'CẢNH BÁO: Cần can thiệp khẩn cấp';
    statusDesc = 'Có chỉ số đường huyết rơi vào vùng nguy hiểm hoặc cữ thuốc bị trễ nghiêm trọng.';
  } else if (isWarning) {
    statusCardClass = styles.statusWarning;
    statusTitle = 'LƯU Ý: Có cữ thuốc cần kiểm tra';
    statusDesc = 'Có cữ thuốc chưa được xác nhận uống quá giờ dự kiến. Gia đình nên nhắc nhở.';
  }

  const items = timelineData?.items || [];
  const summary = timelineData?.summary || { total_doses: 0, taken_doses: 0, glucose_readings: 0 };

  return (
    <div className={styles.container}>
      {/* 1. Thẻ tổng quan an tâm ở trên cùng (Option 1A) */}
      <div className={`${styles.peaceCard} ${statusCardClass}`}>
        <div className={styles.peaceHeader}>
          <div>
            <h3 className={styles.peaceTitle}>{statusTitle}</h3>
            <p className={styles.peaceDesc}>{statusDesc}</p>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBadge}>
            <span>Thuốc:</span>
            <b>{summary.taken_doses}/{summary.total_doses} cữ</b>
          </div>
          <div className={styles.statBadge}>
            <span>Đường huyết:</span>
            <b>{summary.glucose_readings} lần đo</b>
          </div>
        </div>
      </div>

      {/* 2. Dòng thời gian Live Care Timeline kiểu Grab */}
      <div className={styles.timelineSection}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionTitle}>Dòng thời gian hôm nay</h4>
          <span className={styles.dateTag}>{timelineData?.date || 'Hôm nay'}</span>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: '13px' }}>
            Hôm nay chưa có lịch thuốc hoặc chỉ số đường huyết nào được ghi nhận.
          </div>
        ) : (
          <div className={styles.timelineList}>
            {items.map((item) => {
              const isMed = item.type === 'medication';
              const isTaken = item.status === 'taken';
              const isMissed = item.status === 'missed';

              let itemClass = styles.itemPending;
              let badgeText = 'Đang đợi';
              let badgeClass = styles.badgePending;

              if (isTaken) {
                itemClass = styles.itemCompleted;
                badgeText = item.taken_at ? `Đã uống ${item.taken_at}` : 'Đã uống';
                badgeClass = styles.badgeTaken;
              } else if (isMissed) {
                itemClass = styles.itemMissed;
                badgeText = 'Trễ cữ (>60p)';
                badgeClass = styles.badgeMissed;
              } else if (!isMed) {
                if (item.status === 'danger') {
                  itemClass = styles.itemDanger;
                  badgeText = 'Nguy hiểm';
                  badgeClass = styles.badgeMissed;
                } else {
                  itemClass = styles.itemCompleted;
                  badgeText = 'Đã đo';
                  badgeClass = styles.badgeTaken;
                }
              }

              return (
                <div key={item.id} className={`${styles.timelineItem} ${itemClass}`}>
                  <div className={styles.nodeMarker} />
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTime}>{item.time}</span>
                      <span className={`${styles.itemStatusBadge} ${badgeClass}`}>{badgeText}</span>
                    </div>

                    <h5 className={styles.itemTitle}>{item.title}</h5>
                    <p className={styles.itemSubtitle}>{item.subtitle}</p>

                    {/* Nút bấm to 1-chạm cho cụ / người chăm xác nhận (Option 2B) */}
                    {isMed && !isTaken && (
                      <button
                        className={styles.actionBtnBig}
                        disabled={actionLoading}
                        onClick={() => handleConfirmDose(item.medication_id, item.time)}
                      >
                        <span>Tôi đã uống cữ này</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bản tin tuần cho con cháu (AI Insights) */}
      {weeklyData?.lines && weeklyData.lines.length > 0 && (
        <div className={styles.weeklyBox}>
          <div className={styles.weeklyTitle}>
            <span>{weeklyData.title || 'Bản tin tuần'}</span>
          </div>
          {weeklyData.lines.map((line, idx) => (
            <p key={idx} className={styles.weeklyLine}>{line}</p>
          ))}
        </div>
      )}

      {/* 4. Nút mở Báo cáo 1 trang cho Bác sĩ (Option 4C) */}
      <button className={styles.doctorBriefBtn} onClick={handleOpenDoctorReport} disabled={actionLoading}>
        <span>Xem phiếu tóm tắt điều trị (A4 / Bác sĩ)</span>
      </button>

      {/* Modal Bác sĩ tái khám */}
      {showDoctorModal && (
        <DoctorReportModal
          reportData={doctorReport}
          onClose={() => setShowDoctorModal(false)}
        />
      )}
    </div>
  );
}
