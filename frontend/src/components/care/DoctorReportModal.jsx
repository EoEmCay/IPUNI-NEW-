import React from 'react';
import styles from './DoctorReportModal.module.css';

export default function DoctorReportModal({ onClose, reportData }) {
  if (!reportData) return null;

  const { patient, adherence, glucose_profile, active_medications, period } = reportData;

  const handlePrint = () => {
    window.print();
  };

  // Tạo URL xem trực tiếp cho bác sĩ quét QR
  const liveUrl = `${window.location.origin}/#/doctor-brief?code=${patient?.user_code || ''}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(liveUrl)}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Báo cáo Tóm tắt cho Bác sĩ</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Header BHYT & Người bệnh */}
          <div className={styles.docHeader}>
            <div className={styles.appBrand}>DIA+ · HỒ SƠ THEO DÕI ĐÁI THÁO ĐƯỜNG</div>
            <h1 className={styles.docTitle}>PHIẾU TÓM TẮT DIỄN TIẾN ĐIỀU TRỊ</h1>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Khoảng thời gian: {period || '30 ngày gần nhất'}</div>

            <div className={styles.patientMeta}>
              <div><b>Họ và tên:</b> {patient?.name || '---'}</div>
              <div><b>Mã BN:</b> {patient?.user_code || '---'}</div>
              <div><b>Chẩn đoán:</b> Đái tháo đường Type 2</div>
              <div><b>Số thẻ BHYT:</b> {patient?.insurance_number || '---'}</div>
            </div>
          </div>

          {/* 3 Chỉ số Sinh tử Bác sĩ cần thấy trong 10 giây */}
          <div className={styles.vitalGrid}>
            <div className={styles.vitalCard}>
              <div className={styles.vitalLabel}>ĐỘ TUÂN THỦ TOA</div>
              <div className={styles.vitalValue}>{adherence?.overall_percent || 100}%</div>
              <div style={{ fontSize: '10px', color: '#6B7280' }}>
                Uống {adherence?.total_taken || 0}/{adherence?.total_expected || 0} cữ
              </div>
            </div>

            <div className={styles.vitalCard}>
              <div className={styles.vitalLabel}>ĐƯỜNG HUYẾT TB</div>
              <div className={styles.vitalValue}>
                {glucose_profile?.average_mmol ? `${glucose_profile.average_mmol}` : 'Chưa đo'}
              </div>
              <div style={{ fontSize: '10px', color: '#6B7280' }}>
                {glucose_profile?.time_in_range_percent != null ? `${glucose_profile.time_in_range_percent}% trong mục tiêu` : 'mmol/L'}
              </div>
            </div>

            <div className={styles.vitalCard} style={{ borderColor: glucose_profile?.hypoglycemia_count > 0 ? '#FECACA' : '#E5E7EB' }}>
              <div className={styles.vitalLabel}>CƠN HẠ ĐƯỜNG (&lt;3.9)</div>
              <div className={`${styles.vitalValue} ${glucose_profile?.hypoglycemia_count > 0 ? styles.vitalDanger : ''}`}>
                {glucose_profile?.hypoglycemia_count || 0}
              </div>
              <div style={{ fontSize: '10px', color: glucose_profile?.hypoglycemia_count > 0 ? '#DC2626' : '#6B7280' }}>
                {glucose_profile?.hypoglycemia_count > 0 ? '⚠️ Cần điều chỉnh liều' : 'An toàn'}
              </div>
            </div>
          </div>

          {/* Cảnh báo quy luật bỏ thuốc nếu có */}
          {adherence?.recurrent_miss_patterns && adherence.recurrent_miss_patterns.length > 0 && (
            <div className={styles.patternAlert}>
              <b>⚠️ Phát hiện quy luật bỏ thuốc:</b> Bệnh nhân thường xuyên quên {adherence.recurrent_miss_patterns[0].label} (lỡ {adherence.recurrent_miss_patterns[0].missed}/{adherence.recurrent_miss_patterns[0].total} tuần). Khuyến nghị bác sĩ xem xét gộp cữ hoặc đổi phác đồ ít lần dùng hơn.
            </div>
          )}

          {/* Danh sách thuốc đang dùng */}
          <div className={styles.sectionTitle}>
            <span>💊 Toa thuốc hiện hành ({active_medications?.length || 0} loại)</span>
          </div>
          {active_medications && active_medications.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên thuốc</th>
                  <th>Liều dùng</th>
                  <th>Tần suất</th>
                  <th>Chỉ dẫn</th>
                </tr>
              </thead>
              <tbody>
                {active_medications.map((m, idx) => (
                  <tr key={idx}>
                    <td><b>{m.name}</b></td>
                    <td>{m.dosage || '---'}</td>
                    <td>{m.frequency || 'Hằng ngày'}</td>
                    <td>{m.instructions || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Chưa có đơn thuốc nào đang kích hoạt.</div>
          )}

          {/* Mã QR xem nhanh trên điện thoại (Option 4C) */}
          <div className={styles.qrCard}>
            <img src={qrCodeUrl} alt="Mã QR Bác sĩ" className={styles.qrImage} />
            <div>
              <div className={styles.qrTextTitle}>Bác sĩ xem nhanh trên điện thoại?</div>
              <p className={styles.qrTextDesc}>
                Quét mã QR bằng camera để mở hồ sơ điện tử trực tiếp, xem chi tiết biểu đồ đường huyết 30 ngày mà không cần cài app.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.printBtn} onClick={handlePrint}>
            <span>🖨️ In phiếu A4 / Lưu PDF</span>
          </button>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
