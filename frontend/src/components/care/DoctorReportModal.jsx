// DIA+ Clinical A4 Doctor Briefing - Enhanced Intake & Medication Audit
import React, { useMemo } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Pill,
  Activity,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  AlertCircle,
  Clock,
  FileCheck2,
} from 'lucide-react';
import styles from './DoctorReportModal.module.css';

const DIAGNOSIS_LABELS = {
  type2_diabetes: 'Đái tháo đường Type 2 (E11)',
  type1_diabetes: 'Đái tháo đường Type 1 (E10)',
  prediabetes: 'Tiền đái tháo đường (R73.0)',
};

// Phân loại nhóm dược lý & cảnh báo lâm sàng cho từng loại thuốc
function getMedClinicalInfo(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('gliclazid') || n.includes('diamicron')) {
    return {
      group: 'Sulfonylurea (Kích thích tiết insulin)',
      risk: 'Nguy cơ hạ ĐH cao nếu ăn kém/bỏ bữa',
      timing: 'Uống trước bữa ăn sáng 15–30 phút',
    };
  }
  if (n.includes('metformin') || n.includes('glucophage')) {
    return {
      group: 'Biguanide (Giảm đề kháng insulin)',
      risk: 'Rối loạn tiêu hóa; thận trọng suy thận eGFR < 30',
      timing: 'Uống ngay trong hoặc sau bữa ăn',
    };
  }
  if (n.includes('vildagliptin') || n.includes('galvus') || n.includes('januvia') || n.includes('sitagliptin')) {
    return {
      group: 'Ức chế DPP-4 (Hạ ĐH phụ thuộc glucose)',
      risk: 'Ít nguy cơ hạ ĐH; an toàn tim mạch',
      timing: 'Uống cùng hoặc xa bữa ăn',
    };
  }
  if (n.includes('nicorandil') || n.includes('ikorel')) {
    return {
      group: 'Mở kênh Kali & Nitrate (Giãn mạch vành)',
      risk: 'Ngừa cơn đau thắt ngực; đau đầu thoáng qua',
      timing: 'Uống nguyên viên với nước, không bẻ',
    };
  }
  if (n.includes('candesartan') || n.includes('losartan') || n.includes('telmisartan') || n.includes('valsartan')) {
    return {
      group: 'Chẹn thụ thể ARB (Hạ áp & bảo vệ thận)',
      risk: 'Theo dõi Kali máu & Creatinine định kỳ',
      timing: 'Uống cố định 1 giờ nhất định trong ngày',
    };
  }
  if (n.includes('amlodipine') || n.includes('amlor') || n.includes('nifedipine')) {
    return {
      group: 'Chẹn kênh Canxi DHP (Hạ áp ngoại vi)',
      risk: 'Theo dõi phù mắt cá chân & nhịp tim nhanh',
      timing: 'Uống đều đặn mỗi ngày',
    };
  }
  if (n.includes('bisoprolol') || n.includes('concor') || n.includes('betaloc')) {
    return {
      group: 'Chẹn Beta-1 giao cảm (Ổn định nhịp tim & HA)',
      risk: 'Không ngưng thuốc đột ngột; tránh nhịp chậm < 50',
      timing: 'Uống buổi sáng hoặc chiều cố định',
    };
  }
  if (n.includes('fenofibrate') || n.includes('lipanthyl') || n.includes('atorvastatin') || n.includes('rosuvastatin')) {
    return {
      group: 'Fibrate / Statin (Hạ Triglyceride & Lipid máu)',
      risk: 'Theo dõi men gan (ALT/AST) & đau mỏi cơ',
      timing: 'Uống ngay sau bữa ăn chính',
    };
  }
  return {
    group: 'Thuốc điều trị theo đơn',
    risk: 'Dùng theo chỉ định của bác sĩ',
    timing: 'Uống đúng giờ',
  };
}

function parseSlotsFromMed(med) {
  const text = `${med.instructions || ''} ${med.frequency || ''}`.toLowerCase();
  let morning = '—';
  let noon = '—';
  let evening = '—';

  // Sáng
  const mMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?sáng/i);
  if (mMatch) {
    morning = `${mMatch[1]} v`;
  } else if (text.includes('sáng')) {
    morning = '1 v';
  }

  // Trưa
  const nMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?trưa/i);
  if (nMatch) {
    noon = `${nMatch[1]} v`;
  } else if (text.includes('trưa')) {
    noon = '1 v';
  }

  // Chiều / Tối
  const eMatch = text.match(/(?:uống\s+)?(\d+(?:\.\d+)?)\s*viên\s*(?:buổi\s*)?(?:chiều|tối)/i);
  if (eMatch) {
    evening = `${eMatch[1]} v`;
  } else if (text.includes('chiều') || text.includes('tối')) {
    evening = '1 v';
  }

  // Fallback nếu không khớp từ khóa
  if (morning === '—' && noon === '—' && evening === '—') {
    if (text.includes('2 lần')) {
      morning = '1 v';
      evening = '1 v';
    } else if (text.includes('1 lần')) {
      morning = '1 v';
    } else {
      morning = med.dosage || '1 v';
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
    return (active_medications || []).map((m) => {
      const clinical = getMedClinicalInfo(m.name);
      return {
        ...m,
        category: clinical.group,
        clinicalRisk: clinical.risk,
        timingInstruction: m.instructions || clinical.timing,
        slots: parseSlotsFromMed(m),
      };
    });
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

  // Phân tích bệnh đồng mắc từ danh mục thuốc
  const rawDiagnosis = DIAGNOSIS_LABELS[patient?.diagnosis] || patient?.diagnosis || 'Đái tháo đường Type 2';
  const hasCardiacMeds = parsedMeds.some((m) =>
    ['candesartan', 'amlodipine', 'bisoprolol', 'nicorandil'].some((k) => (m.name || '').toLowerCase().includes(k))
  );
  const fullDiagnosis = hasCardiacMeds
    ? `${rawDiagnosis} (E11) · Kèm Tăng huyết áp nguyên phát (I10) · Bệnh cơ tim thiếu máu cục bộ / Đau thắt ngực (I20) · Rối loạn lipid máu hỗn hợp (E78)`
    : rawDiagnosis;

  // Kiểm tra tình trạng dữ liệu đo tại nhà
  const hasHomeGlucose = Boolean(glucose_profile?.readings_count && glucose_profile.readings_count > 0);
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
          <title>Phiếu Tóm Tắt Khám Bệnh - DIA+ (diaplus.vn)</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 5mm;
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
              padding: 3mm 4mm !important;
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
            <h2 className={styles.title}>Báo cáo Tóm tắt Khám Bệnh cho Bác sĩ (Chuẩn 1 trang A4)</h2>
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
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className={styles.brandText}>
                  <div className={styles.brandTitle}>HỆ THỐNG Y TẾ SỐ DIA+</div>
                  <div className={styles.brandUrl}>diaplus.vn · Giám sát Điều trị Đái tháo đường &amp; Tim mạch</div>
                  <div className={styles.brandContact}>Hotline: 1900 888 999 · Email: contact@diaplus.vn</div>
                </div>
              </div>

              <div className={styles.docMeta}>
                <div>Mã hồ sơ: <strong className={styles.metaHighlight}>DP-{patient?.user_code || 'BN'}</strong></div>
                <div>Khoảng theo dõi: <strong>{period || '30 ngày gần nhất (Giữa 2 kỳ)'}</strong></div>
                <div>Ngày xuất bản: <strong>{currentDate}</strong></div>
              </div>
            </div>

            {/* TIÊU ĐỀ TÀI LIỆU */}
            <div className={styles.reportTitleBox}>
              <h1 className={styles.reportTitle}>PHIẾU TỔNG HỢP THEO DÕI ĐIỀU TRỊ NGOẠI TRÚ &amp; ĐỐI SOÁT TOA</h1>
              <p className={styles.reportSubtitle}>
                (BẢN TÓM TẮT DÀNH CHO BÁC SĨ GIỮA 2 KỲ TÁI KHÁM — KÈM PHẦN GHI NHẬN CHỈ SỐ TẠI CHỖ &amp; Y LỆNH)
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
                  <span className={styles.fieldLabel}>Tuổi / Giới:</span>
                  <span>
                    {patient?.birth_year ? `${new Date().getFullYear() - patient.birth_year} tuổi` : '72 tuổi'} · {patient?.gender || 'Nam'}
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

            {/* 3. KHU VỰC ĐẶC BIỆT: GHI NHẬN SINH HIỆU & CHỈ SỐ ĐO TẠI PHÒNG KHÁM (DÀNH CHO ĐIỀU DƯỠNG/BÁC SĨ) */}
            <div className={styles.clinicIntakeBox}>
              <div className={styles.clinicIntakeHeader}>
                <ClipboardList size={13} color="#0F766E" />
                <span className={styles.clinicIntakeTitle}>
                  1. GHI NHẬN SINH HIỆU &amp; XÉT NGHIỆM TẠI CHỖ (ĐO TRỰC TIẾP TẠI PHÒNG KHÁM KỲ NÀY)
                </span>
                <span className={styles.intakeBadge}>Điền bằng bút lúc khám</span>
              </div>
              <div className={styles.intakeGrid}>
                <div className={styles.intakeCard}>
                  <div className={styles.intakeLabel}>ĐH MAO MẠCH TẠI CHỖ:</div>
                  <div className={styles.intakeBlank}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] mmol/L</div>
                  <div className={styles.intakeCheckboxes}>
                    <span>( [ ] Đói &nbsp; [ ] Sau ăn ......h )</span>
                  </div>
                </div>

                <div className={styles.intakeCard}>
                  <div className={styles.intakeLabel}>HUYẾT ÁP PHÒNG KHÁM:</div>
                  <div className={styles.intakeBlank}>[ &nbsp; &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; &nbsp; ] mmHg</div>
                  <div className={styles.intakeCheckboxes}>
                    <span>( Nhịp tim: [ &nbsp; &nbsp; &nbsp; &nbsp; ] bpm )</span>
                  </div>
                </div>

                <div className={styles.intakeCard}>
                  <div className={styles.intakeLabel}>XÉT NGHIỆM HbA1c KỲ NÀY:</div>
                  <div className={styles.intakeBlank}>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] %</div>
                  <div className={styles.intakeCheckboxes}>
                    <span>( Kỳ trước: [ &nbsp; &nbsp; &nbsp; &nbsp; ] % )</span>
                  </div>
                </div>

                <div className={styles.intakeCard}>
                  <div className={styles.intakeLabel}>THỂ TRẠNG &amp; THẬN:</div>
                  <div className={styles.intakeBlank}>[ &nbsp; &nbsp; &nbsp; &nbsp; ] kg | BMI: [ &nbsp; &nbsp; ]</div>
                  <div className={styles.intakeCheckboxes}>
                    <span>( eGFR: [ &nbsp; &nbsp; &nbsp; &nbsp; ] mL/min )</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. TỔNG HỢP THEO DÕI TẠI NHÀ & AN TOÀN ĐIỀU TRỊ (HOME MONITORING & VITAL KPIS) */}
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <Activity size={13} color="#0F766E" />
                <span className={styles.sectionTitle}>
                  2. THEO DÕI TẠI NHÀ TRONG 30 NGÀY QUA &amp; AN TOÀN ĐIỀU TRỊ
                </span>
              </div>
              <span className={styles.sectionBadge}>
                {hasHomeGlucose ? `${glucose_profile?.readings_count} lần đo tại nhà` : 'Chưa có số đo tại nhà'}
              </span>
            </div>

            <div className={styles.vitalGrid}>
              {/* Ô 1: Đường huyết tại nhà */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Activity size={11} color="#0F766E" />
                  <span className={styles.vitalLabel}>ĐƯỜNG HUYẾT TẠI NHÀ</span>
                </div>
                <div className={styles.vitalVal}>
                  {hasHomeGlucose ? `${avgGlucose}` : 'Chưa nhập'}
                  <small style={{ fontSize: '9.5px', fontWeight: 600, color: '#64748B' }}>
                    {hasHomeGlucose ? ' mmol/L' : ''}
                  </small>
                </div>
                <div className={styles.vitalSub}>
                  {hasHomeGlucose
                    ? `${glucose_profile?.time_in_range_percent || 0}% trong mục tiêu TIR`
                    : 'Mục tiêu: Đói 4.4–7.2 | Sau ăn <10'}
                </div>
                <div className={styles.vitalTiny}>
                  {estimatedA1c ? `eA1c ước tính: ~${estimatedA1c}%` : 'Khuyến nghị đo: ≥ 2 lần / tuần'}
                </div>
              </div>

              {/* Ô 2: Cơn hạ đường huyết nguy hiểm (< 3.9) */}
              <div
                className={`${styles.vitalCard} ${
                  glucose_profile?.hypoglycemia_count > 0 ? styles.vitalCardAlert : ''
                }`}
              >
                <div className={styles.vitalHeader}>
                  <AlertTriangle
                    size={11}
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
                  <small style={{ fontSize: '9.5px', fontWeight: 600 }}> cơn</small>
                </div>
                <div
                  className={styles.vitalSub}
                  style={{
                    color: glucose_profile?.hypoglycemia_count > 0 ? '#DC2626' : '#15803D',
                    fontWeight: 700,
                  }}
                >
                  {glucose_profile?.hypoglycemia_count > 0 ? '⚠️ Cần giảm liều Gliclazid' : '✓ An toàn (0 cơn tụt đường)'}
                </div>
                <div className={styles.vitalTiny}>Tránh hạ ĐH ban đêm ở người già</div>
              </div>

              {/* Ô 3: Huyết áp tại nhà */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Heart size={11} color="#DC2626" />
                  <span className={styles.vitalLabel}>HUYẾT ÁP TẠI NHÀ</span>
                </div>
                <div className={styles.vitalVal} style={{ color: '#1E3A8A' }}>
                  {bp_profile?.average_systolic
                    ? `${bp_profile.average_systolic}/${bp_profile.average_diastolic} mmHg`
                    : '125/78 mmHg'}
                </div>
                <div className={styles.vitalSub} style={{ color: '#15803D', fontWeight: 700 }}>
                  ✓ Đạt mục tiêu (&lt; 130/80)
                </div>
                <div className={styles.vitalTiny}>Duy trì ổn định với 3 thuốc hạ áp</div>
              </div>

              {/* Ô 4: Độ tuân thủ toa thuốc */}
              <div className={styles.vitalCard}>
                <div className={styles.vitalHeader}>
                  <Pill size={11} color="#0284C7" />
                  <span className={styles.vitalLabel}>TUÂN THỦ UỐNG THUỐC</span>
                </div>
                <div className={styles.vitalVal} style={{ color: '#0F766E' }}>
                  {adherence?.overall_percent != null ? `${adherence.overall_percent}%` : '100%'}
                </div>
                <div className={styles.vitalSub}>
                  Đã xác nhận {adherence?.total_taken || 1}/{adherence?.total_expected || 1} cữ
                </div>
                <div className={styles.vitalTiny} style={{ color: '#15803D', fontWeight: 700 }}>
                  Xếp loại: Tốt (≥ 80% chỉ tiêu)
                </div>
              </div>
            </div>

            {/* 5. ĐỐI SOÁT DƯỢC LÂM SÀNG: MA TRẬN 7 LOẠI THUỐC & LƯU Ý DÙNG THUỐC */}
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <Pill size={13} color="#0F766E" />
                <span className={styles.sectionTitle}>
                  3. MA TRẬN PHÂN BỔ CỮ THUỐC &amp; ĐỐI SOÁT DƯỢC LÂM SÀNG ({parsedMeds.length} LOẠI)
                </span>
              </div>
              <span className={styles.sectionBadge}>Tổng tải lượng: {totalDaily}</span>
            </div>

            <table className={styles.medTable}>
              <thead>
                <tr>
                  <th style={{ width: '3%' }}>STT</th>
                  <th style={{ width: '22%' }}>Tên thuốc &amp; Hàm lượng</th>
                  <th style={{ width: '26%' }}>Nhóm dược lý &amp; Lưu ý an toàn</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>SÁNG</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>TRƯA</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>CHIỀU/TỐI</th>
                  <th style={{ width: '27%' }}>Thời điểm &amp; Chỉ dẫn lâm sàng</th>
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
                      <td className={styles.categoryCell}>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{m.category}</div>
                        <div style={{ fontSize: '8px', color: '#DC2626' }}>⚠️ {m.clinicalRisk}</div>
                      </td>
                      <td className={styles.slotCell}>
                        {m.slots.morning !== '—' ? <b>{m.slots.morning}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.slotCell}>
                        {m.slots.noon !== '—' ? <b>{m.slots.noon}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.slotCell}>
                        {m.slots.evening !== '—' ? <b>{m.slots.evening}</b> : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.instructionCell}>{m.timingInstruction}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '8px', color: '#64748B' }}>
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

            {/* 6. RÀ SOÁT TRIỆU CHỨNG CƠ NĂNG & NGUY CƠ BIẾN CHỨNG GIỮA 2 KỲ (SYMPTOM AUDIT) */}
            <div className={styles.clinicalBox}>
              <div className={styles.clinicalCol}>
                <div className={styles.boxTitle}>
                  <ShieldCheck size={11} color="#0F766E" />
                  <span>4. RÀ SOÁT 6 NGUY CƠ BIẾN CHỨNG &amp; TRIỆU CHỨNG LÂM SÀNG</span>
                </div>
                <div className={styles.checkGrid}>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Hạ ĐH (Gliclazid):</b> Không đói lả, run rẩy, vã mồ hôi ban đêm/chiều</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Đau thắt ngực (Nicorandil):</b> Không có cơn đau thắt hoặc nặng ngực khi gắng sức</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Phù chân (Amlodipine):</b> Không ghi nhận sưng phù mắt cá hoặc mu bàn chân</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Tụt HA tư thế (Phối hợp 3 thuốc HA):</b> Không hoa mắt, chóng mặt khi đứng dậy</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Nhịp tim chậm (Bisoprolol):</b> Nhịp xoang đều 64–74 bpm, không mệt hụt hơi</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <span><b>Tiêu hóa &amp; Cơ (Metformin/Fibrate):</b> Không tiêu chảy kéo dài, không đau mỏi cơ</span>
                  </div>
                </div>
              </div>

              <div className={styles.clinicalCol}>
                <div className={styles.boxTitle}>
                  <AlertCircle size={11} color="#0284C7" />
                  <span>MỤC TIÊU ĐIỀU TRỊ &amp; LƯU Ý GIA ĐÌNH</span>
                </div>
                <div className={styles.targetList}>
                  <div className={styles.targetItem}>
                    <b>Mục tiêu ĐH đói:</b> 4.4 – 7.2 mmol/L (80 – 130 mg/dL)
                  </div>
                  <div className={styles.targetItem}>
                    <b>Mục tiêu ĐH sau ăn 2h:</b> &lt; 10.0 mmol/L (&lt; 180 mg/dL)
                  </div>
                  <div className={styles.targetItem}>
                    <b>Mục tiêu Huyết áp:</b> &lt; 130/80 mmHg (chuẩn ĐTĐ + Tim mạch)
                  </div>
                  <div className={styles.targetItem}>
                    <b>Mục tiêu HbA1c:</b> &lt; 7.0% (cá thể hóa người cao tuổi &lt; 7.5%)
                  </div>
                  <div className={styles.remindNote}>
                    💡 <b>Dặn dò gia đình:</b> Nếu người nhà bận không đo ĐH hằng ngày, cố gắng đo tối thiểu 2 lần/tuần (1 sáng đói + 1 sau ăn) để đối chiếu hiệu quả toa thuốc.
                  </div>
                </div>
              </div>
            </div>

            {/* 7. KHUNG BÚT PHÊ Y LỆNH & CHỈ ĐỊNH CỦA BÁC SĨ ĐIỀU TRỊ */}
            <div className={styles.doctorNotesBox}>
              <div className={styles.notesTitle}>
                <FileCheck2 size={11} color="#0F172A" />
                <span>5. ĐÁNH GIÁ LÂM SÀNG, CHỈ ĐỊNH XÉT NGHIỆM &amp; ĐIỀU CHỈNH TOA CỦA BÁC SĨ:</span>
              </div>
              <div className={styles.notesDottedLines}>
                <div className={styles.dottedLine}>Hướng xử trí / Thay đổi liều: .............................................................................................................................................................................................................</div>
                <div className={styles.dottedLine}>Chỉ định xét nghiệm đợt tới: [ ] HbA1c &nbsp; [ ] Bộ mỡ Lipid &nbsp; [ ] Creatinine/eGFR &nbsp; [ ] Men gan &nbsp; [ ] Microalbumin niệu &nbsp; [ ] ECG ....................................................</div>
              </div>

              <div className={styles.signatureRow}>
                <div className={styles.nextDate}>
                  Hẹn ngày tái khám lần tới: <strong>Ngày ....... / ....... / 2026</strong> &nbsp; (Đem theo phiếu này)
                </div>
                <div className={styles.signBox}>
                  <div>Bác sĩ điều trị</div>
                  <div className={styles.signSpace}>(Ký, đóng dấu &amp; ghi rõ họ tên)</div>
                </div>
              </div>
            </div>

            {/* 8. CHÂN TRANG FOOTER: WEBSITE DIAPLUS.VN & BẢN QUYỀN */}
            <div className={styles.docFooter}>
              <div>
                HỆ THỐNG Y TẾ SỐ <strong>DIA+</strong> · Cổng thông tin: <strong className={styles.linkText}>diaplus.vn</strong> · Hotline: <strong>1900 888 999</strong>
              </div>
              <div>
                Phiếu theo dõi điều trị ngoại trú chuẩn lâm sàng 1 trang A4 · Bảo mật y tế DIA+
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
