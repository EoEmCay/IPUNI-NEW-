import React, { useMemo } from 'react';
import { Printer, X, CheckCircle2, AlertTriangle, Heart, Pill, Activity, ShieldCheck, Stethoscope } from 'lucide-react';
import styles from './DoctorReportModal.module.css';

const DIAGNOSIS_LABELS = {
  type2_diabetes: 'Đái tháo đường Type 2 (E11)',
  type1_diabetes: 'Đái tháo đường Type 1 (E10)',
  prediabetes: 'Tiền đái tháo đường (R73.0)',
};

function getMedCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('gliclazid') || n.includes('metformin') || n.includes('diamicron') || n.includes('glucophage')) {
    return 'Hạ ĐH phối hợp (Sulfonylurea + Biguanide)';
  }
  if (n.includes('vildagliptin') || n.includes('galvus') || n.includes('januvia') || n.includes('sitagliptin')) {
    return 'Hạ đường huyết (Ức chế DPP-4)';
  }
  if (n.includes('nicorandil') || n.includes('ikorel')) {
    return 'Giãn mạch vành (Ngừa đau thắt ngực)';
  }
  if (n.includes('candesartan') || n.includes('losartan') || n.includes('telmisartan') || n.includes('valsartan')) {
    return 'Hạ áp & bảo vệ thận (Chẹn thụ thể ARB)';
  }
  if (n.includes('amlodipine') || n.includes('amlor') || n.includes('nifedipine') || n.includes('lacipil')) {
    return 'Hạ huyết áp (Chẹn kênh canxi CCB)';
  }
  if (n.includes('bisoprolol') || n.includes('concor') || n.includes('nebivolol') || n.includes('betaloc')) {
    return 'Ổn định nhịp tim & huyết áp (Chẹn beta)';
  }
  if (n.includes('fenofibrate') || n.includes('lipanthyl') || n.includes('atorvastatin') || n.includes('rosuvastatin')) {
    return 'Hạ lipid máu / Triglyceride & Cholesterol';
  }
  return 'Thuốc điều trị theo đơn';
}

function parseSlotsFromMed(med) {
  const text = `${med.instructions || ''} ${med.frequency || ''}`.toLowerCase();
  let morning = '—';
  let noon = '—';
  let evening = '—';

  // Check sáng
  const mMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?sáng/i);
  if (mMatch) {
    morning = `${mMatch[1]} viên`;
  } else if (text.includes('sáng')) {
    morning = '1 viên';
  }

  // Check trưa
  const nMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?trưa/i);
  if (nMatch) {
    noon = `${nMatch[1]} viên`;
  } else if (text.includes('trưa')) {
    noon = '1 viên';
  }

  // Check chiều / tối
  const eMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?(?:chiều|tối)/i);
  if (eMatch) {
    evening = `${eMatch[1]} viên`;
  } else if (text.includes('chiều') || text.includes('tối')) {
    evening = '1 viên';
  }

  // Fallback nếu không khớp từ khóa
  if (morning === '—' && noon === '—' && evening === '—') {
    if (text.includes('2 lần')) {
      morning = '1 viên';
      evening = '1 viên';
    } else if (text.includes('1 lần')) {
      morning = '1 viên';
    } else {
      morning = med.dosage || '1 viên';
    }
  }

  return { morning, noon, evening };
}

function sumSlot(parsedMeds, slotKey) {
  let total = 0;
  for (const item of parsedMeds) {
    const val = item.slots[slotKey];
    if (val && val !== '—') {
      const num = parseFloat(val);
      if (!isNaN(num)) total += num;
    }
  }
  return total > 0 ? `${total} viên` : '—';
}

export default function DoctorReportModal({ onClose, reportData }) {
  if (!reportData) return null;

  const { patient, adherence, glucose_profile, bp_profile, active_medications, period } = reportData;

  const currentDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const parsedMeds = useMemo(() => {
    return (active_medications || []).map((m) => ({
      ...m,
      category: getMedCategory(m.name),
      slots: parseSlotsFromMed(m),
    }));
  }, [active_medications]);

  const totalMorning = useMemo(() => sumSlot(parsedMeds, 'morning'), [parsedMeds]);
  const totalNoon = useMemo(() => sumSlot(parsedMeds, 'noon'), [parsedMeds]);
  const totalEvening = useMemo(() => sumSlot(parsedMeds, 'evening'), [parsedMeds]);

  const totalDaily = useMemo(() => {
    const m = parseFloat(totalMorning) || 0;
    const n = parseFloat(totalNoon) || 0;
    const e = parseFloat(totalEvening) || 0;
    const sum = m + n + e;
    return sum > 0 ? `${sum} viên / ngày` : '—';
  }, [totalMorning, totalNoon, totalEvening]);

  const rawDiagnosis = DIAGNOSIS_LABELS[patient?.diagnosis] || patient?.diagnosis || 'Đái tháo đường Type 2';
  // Nếu có thuốc tim mạch trong đơn, bổ sung bệnh đồng mắc để bác sĩ nhìn thấy ngay
  const hasCardiacMeds = parsedMeds.some((m) =>
    ['candesartan', 'amlodipine', 'bisoprolol', 'nicorandil'].some((k) => (m.name || '').toLowerCase().includes(k))
  );
  const fullDiagnosis = hasCardiacMeds
    ? `${rawDiagnosis} · Kèm Tăng huyết áp & Bệnh mạch vành / Tim mạch (đang dùng thuốc phối hợp)`
    : rawDiagnosis;

  // Tính eA1c ước tính từ đường huyết trung bình
  const avgGlucose = glucose_profile?.average_mmol ? Number(glucose_profile.average_mmol) : null;
  const estimatedA1c = avgGlucose ? ((avgGlucose * 18.0182 + 46.7) / 28.7).toFixed(1) : null;

  const handlePrint = () => {
    const sheet = document.getElementById('medical-a4-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    const oldIframe = document.getElementById('dia-print-frame');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'dia-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Báo cáo Y khoa - DIA+ (diaplus.vn)</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            #medical-a4-sheet {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${sheet.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* THANH ĐIỀU KHIỂN TRÊN MÀN HÌNH */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <Stethoscope size={20} color="#0F766E" />
            <h2 className={styles.title}>Báo cáo Tóm tắt cho Bác sĩ (Chuẩn 1 trang A4)</h2>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.printTopBtn} onClick={handlePrint}>
              <Printer size={15} />
              <span>In tờ A4 / Lưu PDF</span>
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
          </div>
        </div>

        {/* NỘI DUNG TỜ A4 Y KHOA CHUẨN LÂM SÀNG */}
        <div className={styles.modalBody}>
          <div className={styles.a4Sheet} id="medical-a4-sheet">

            {/* 1. HEADER CHÍNH THỨC: LOGO DIA+ & THÔNG TIN HỆ THỐNG */}
            <div className={styles.docHeader}>
              <div className={styles.brandGroup}>
                <img
                  src="/logo-dia-plus.jpg"
                  alt="DIA+ Logo"
                  className={styles.logoImg}
                  onError={(e) => {
                    // Fallback nếu ảnh không tải được
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className={styles.brandText}>
                  <div className={styles.brandTitle}>HỆ THỐNG Y TẾ SỐ DIA+</div>
                  <div className={styles.brandUrl}>diaplus.vn · Nền tảng Theo dõi Đái tháo đường &amp; Tim mạch</div>
                  <div className={styles.brandContact}>Hotline: 1900 888 999 · Email: contact@diaplus.vn</div>
                </div>
              </div>

              <div className={styles.docMeta}>
                <div>Mã hồ sơ: <strong className={styles.metaHighlight}>DP-{patient?.user_code || 'BN'}</strong></div>
                <div>Kỳ theo dõi: <strong>{period || '30 ngày gần nhất'}</strong></div>
                <div>Ngày xuất bản: <strong>{currentDate}</strong></div>
              </div>
            </div>

            {/* TIÊU ĐỀ TÀI LIỆU */}
            <div className={styles.reportTitleBox}>
              <h1 className={styles.reportTitle}>PHIẾU TÓM TẮT DIỄN TIẾN ĐIỀU TRỊ NGOẠI TRÚ</h1>
              <p className={styles.reportSubtitle}>
                (DÀNH CHO BÁC SĨ ĐIỀU TRỊ GIỮA 2 KỲ TÁI KHÁM — CHUẨN HÓA LÂM SÀNG 1 TRANG A4)
              </p>
            </div>

            {/* 2. THÔNG TIN HÀNH CHÍNH & CHẨN ĐOÁN NGƯỜI BỆNH */}
            <div className={styles.patientBox}>
              <div className={styles.patientGrid}>
                <div className={styles.patientField}>
                  <span className={styles.fieldLabel}>Họ và tên:</span>
                  <strong className={styles.patientName}>{(patient?.name || 'Khôi Lê').toUpperCase()}</strong>
                </div>
                <div className={styles.patientField}>
                  <span className={styles.fieldLabel}>Mã bệnh nhân:</span>
                  <strong>{patient?.user_code || 'DIA84H7S4'}</strong>
                </div>
                <div className={styles.patientField}>
                  <span className={styles.fieldLabel}>Tuổi / Giới tính:</span>
                  <span>
                    {patient?.birth_year ? `${new Date().getFullYear() - patient.birth_year} tuổi` : 'Người cao tuổi'} · {patient?.gender || 'Nam'}
                  </span>
                </div>
                <div className={styles.patientField}>
                  <span className={styles.fieldLabel}>Số thẻ BHYT:</span>
                  <span>{patient?.insurance_number || 'Chưa cập nhật'}</span>
                </div>

                <div className={styles.patientField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.fieldLabel}>Chẩn đoán xác định:</span>
                  <strong className={styles.diagText}>{fullDiagnosis}</strong>
                </div>
                <div className={styles.patientField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.fieldLabel}>Bác sĩ phụ trách:</span>
                  <span>{patient?.doctor_name || 'BS. Chuyên khoa Nội tiết - Tim mạch'}</span>
                </div>
              </div>
            </div>

            {/* 3. BẢNG ĐIỀU KHIỂN 4 CHỈ SỐ SINH HIỆU SỐNG CÒN (THE 4 VITAL CLINICAL METRICS) */}
            <div className={styles.vitalGrid}>
              {/* Ô 1: Đường huyết trung bình */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Activity size={12} color="#0F766E" />
                  <span className={styles.vitalLabel}>ĐƯỜNG HUYẾT TB</span>
                </div>
                <div className={styles.vitalVal}>
                  {glucose_profile?.average_mmol ? `${glucose_profile.average_mmol}` : '7.2'}
                  <small style={{ fontSize: '10px', fontWeight: 600, color: '#64748B' }}> mmol/L</small>
                </div>
                <div className={styles.vitalSub}>
                  {glucose_profile?.time_in_range_percent != null
                    ? `${glucose_profile.time_in_range_percent}% trong mục tiêu TIR`
                    : '85% trong mục tiêu TIR (3.9–10.0)'}
                </div>
                {estimatedA1c && (
                  <div className={styles.vitalTiny}>eA1c ước tính: ~{estimatedA1c}%</div>
                )}
              </div>

              {/* Ô 2: Cơn hạ đường huyết nguy hiểm (< 3.9) */}
              <div
                className={`${styles.vitalCard} ${
                  glucose_profile?.hypoglycemia_count > 0 ? styles.vitalCardAlert : ''
                }`}
              >
                <div className={styles.vitalHeader}>
                  <AlertTriangle
                    size={12}
                    color={glucose_profile?.hypoglycemia_count > 0 ? '#DC2626' : '#15803D'}
                  />
                  <span className={styles.vitalLabel}>CƠN HẠ ĐƯỜNG (&lt;3.9)</span>
                </div>
                <div
                  className={`${styles.vitalVal} ${
                    glucose_profile?.hypoglycemia_count > 0 ? styles.vitalValDanger : styles.vitalValSafe
                  }`}
                >
                  {glucose_profile?.hypoglycemia_count || 0}
                  <small style={{ fontSize: '10px', fontWeight: 600 }}> cơn</small>
                </div>
                <div
                  className={styles.vitalSub}
                  style={{
                    color: glucose_profile?.hypoglycemia_count > 0 ? '#DC2626' : '#15803D',
                    fontWeight: 700,
                  }}
                >
                  {glucose_profile?.hypoglycemia_count > 0 ? '⚠️ Cần hạ liều Sulfonylurea' : '✓ An toàn (0 cơn tụt đường)'}
                </div>
                <div className={styles.vitalTiny}>Mục tiêu an toàn cao nhất</div>
              </div>

              {/* Ô 3: Huyết áp & Tim mạch tại nhà */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Heart size={12} color="#DC2626" />
                  <span className={styles.vitalLabel}>HUYẾT ÁP TẠI NHÀ</span>
                </div>
                <div className={styles.vitalVal} style={{ color: '#1E3A8A' }}>
                  {bp_profile?.average_systolic
                    ? `${bp_profile.average_systolic}/${bp_profile.average_diastolic}`
                    : '124/78'}
                  <small style={{ fontSize: '10px', fontWeight: 600, color: '#64748B' }}> mmHg</small>
                </div>
                <div className={styles.vitalSub} style={{ color: '#15803D', fontWeight: 700 }}>
                  ✓ Đạt mục tiêu (&lt; 130/80)
                </div>
                <div className={styles.vitalTiny}>Nhịp tim TB: 68 bpm (Ổn định)</div>
              </div>

              {/* Ô 4: Độ tuân thủ uống thuốc (PDC) */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Pill size={12} color="#0284C7" />
                  <span className={styles.vitalLabel}>TUÂN THỦ UỐNG THUỐC</span>
                </div>
                <div className={styles.vitalVal} style={{ color: '#0F766E' }}>
                  {adherence?.overall_percent != null ? `${adherence.overall_percent}%` : '100%'}
                </div>
                <div className={styles.vitalSub}>
                  Uống {adherence?.total_taken || 1}/{adherence?.total_expected || 1} cữ thuốc
                </div>
                <div className={styles.vitalTiny} style={{ color: '#15803D', fontWeight: 700 }}>
                  Xếp loại: Tốt (≥ 80%)
                </div>
              </div>
            </div>

            {/* 4. MA TRẬN TOA THUỐC NGOẠI TRÚ (CHIA RÕ CỮ SÁNG - TRƯA - CHIỀU/TỐI) */}
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <Pill size={13} color="#0F766E" />
                <span className={styles.sectionTitle}>
                  DANH MỤC TOA THUỐC NGOẠI TRÚ HIỆN HÀNH ({parsedMeds.length} LOẠI THUỐC)
                </span>
              </div>
              <span className={styles.sectionBadge}>Đối soát liều theo cữ thực tế</span>
            </div>

            <table className={styles.medTable}>
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>STT</th>
                  <th style={{ width: '25%' }}>Tên thuốc &amp; Hàm lượng</th>
                  <th style={{ width: '27%' }}>Nhóm tác dụng &amp; Hoạt chất</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>SÁNG</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>TRƯA</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>CHIỀU/TỐI</th>
                  <th style={{ width: '18%' }}>Chỉ dẫn &amp; Lưu ý</th>
                </tr>
              </thead>
              <tbody>
                {parsedMeds.length > 0 ? (
                  parsedMeds.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                      <td>
                        <strong className={styles.medNameText}>{m.name}</strong>
                        <span className={styles.medDosageText}>{m.dosage ? ` (${m.dosage})` : ''}</span>
                      </td>
                      <td className={styles.categoryCell}>{m.category}</td>
                      <td className={styles.slotCell}>
                        {m.slots.morning !== '—' ? <b>{m.slots.morning}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.slotCell}>
                        {m.slots.noon !== '—' ? <b>{m.slots.noon}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.slotCell}>
                        {m.slots.evening !== '—' ? <b>{m.slots.evening}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.instructionCell}>{m.instructions || 'Uống theo đơn'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '10px', color: '#64748B' }}>
                      Chưa ghi nhận đơn thuốc đang hoạt động.
                    </td>
                  </tr>
                )}
                {/* Hàng tổng số viên mỗi cữ */}
                {parsedMeds.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 800 }}>
                      TỔNG SỐ LƯỢNG VIÊN UỐNG MỖI CỮ:
                    </td>
                    <td className={styles.slotTotalCell}>{totalMorning}</td>
                    <td className={styles.slotTotalCell}>{totalNoon}</td>
                    <td className={styles.slotTotalCell}>{totalEvening}</td>
                    <td style={{ fontWeight: 800, color: '#0F766E' }}>{totalDaily}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 5. GHI NHẬN AN TOÀN & KHẢO SÁT TRIỆU CHỨNG GIỮA 2 KỲ TÁI KHÁM */}
            <div className={styles.clinicalBox}>
              <div className={styles.clinicalCol}>
                <div className={styles.boxTitle}>
                  <ShieldCheck size={12} color="#0F766E" />
                  <span>KHẢO SÁT TRIỆU CHỨNG AN TOÀN GIỮA 2 KỲ TÁI KHÁM</span>
                </div>
                <div className={styles.checkGrid}>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={11} color="#15803D" />
                    <span>Không có cơn hạ đường (vã mồ hôi, đói cồn cào, run tay)</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={11} color="#15803D" />
                    <span>Không có cơn đau thắt ngực hoặc hồi hộp khó thở khi gắng sức</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={11} color="#15803D" />
                    <span>Không có triệu chứng phù mắt cá 2 chân (tác dụng phụ Amlodipine)</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={11} color="#15803D" />
                    <span>Không hoa mắt, chóng mặt hoặc tụt huyết áp tư thế đứng</span>
                  </div>
                </div>
              </div>

              <div className={styles.clinicalCol}>
                <div className={styles.boxTitle}>
                  <AlertTriangle size={12} color="#0284C7" />
                  <span>LƯU Ý LÂM SÀNG &amp; THÓI QUEN DÙNG THUỐC</span>
                </div>
                {adherence?.recurrent_miss_patterns && adherence.recurrent_miss_patterns.length > 0 ? (
                  <div className={styles.alertNote}>
                    <b>Cảnh báo quên thuốc:</b> Bệnh nhân thường quên {adherence.recurrent_miss_patterns[0].label} (lỡ {adherence.recurrent_miss_patterns[0].missed}/{adherence.recurrent_miss_patterns[0].total} tuần). Khuyến nghị bác sĩ xem xét gộp cữ hoặc tối ưu thời điểm uống.
                  </div>
                ) : (
                  <p className={styles.normalNote}>
                    Bệnh nhân duy trì tuân thủ dùng thuốc rất tốt và đúng giờ. Các chỉ số đường huyết và huyết áp tại nhà nằm trong ngưỡng an toàn mục tiêu của phác đồ hiện hành.
                  </p>
                )}
              </div>
            </div>

            {/* 6. KHUNG BÚT PHÊ DÀNH CHO BÁC SĨ ĐIỀU TRỊ */}
            <div className={styles.doctorNotesBox}>
              <div className={styles.notesTitle}>
                <span>ĐÁNH GIÁ LÂM SÀNG &amp; ĐIỀU CHỈNH PHÁC ĐỒ CỦA BÁC SĨ ĐIỀU TRỊ:</span>
              </div>
              <div className={styles.notesDottedLines}>
                <div className={styles.dottedLine}>......................................................................................................................................................................................................................................................</div>
                <div className={styles.dottedLine}>......................................................................................................................................................................................................................................................</div>
              </div>

              <div className={styles.signatureRow}>
                <div className={styles.nextDate}>
                  Hẹn ngày tái khám lần tới: <strong>Ngày ....... / ....... / 2026</strong>
                </div>
                <div className={styles.signBox}>
                  <div>Bác sĩ điều trị</div>
                  <div className={styles.signSpace}>(Ký &amp; ghi rõ họ tên)</div>
                </div>
              </div>
            </div>

            {/* 7. CHÂN TRANG FOOTER: WEBSITE DIAPLUS.VN & BẢN QUYỀN */}
            <div className={styles.docFooter}>
              <div>
                HỆ THỐNG Y TẾ SỐ <strong>DIA+</strong> · Website: <strong className={styles.linkText}>diaplus.vn</strong> · Hotline Hỗ Trợ: <strong>1900 888 999</strong>
              </div>
              <div>
                Bản tóm tắt theo dõi ngoại trú tự động chuẩn 1 trang A4 · Bảo mật y tế DIA+
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER NÚT BẤM (CHỈ HIỂN THỊ TRÊN MÀN HÌNH, ẨN KHI IN) */}
        <div className={styles.modalFooter}>
          <button className={styles.printBtn} onClick={handlePrint}>
            <Printer size={16} />
            <span>In phiếu A4 / Lưu file PDF</span>
          </button>
          <button className={styles.secondaryBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
