/**
 * Sinh "Sổ theo dõi Đái tháo đường" chuẩn mang đi khám bệnh viện.
 * Nội dung theo khuyến cáo theo dõi ĐTĐ (ADA Standards of Care):
 *  - Hành chính bệnh nhân
 *  - Thống kê: TB, SD, CV%, eA1c/GMI ước tính, TIR (thời gian trong ngưỡng), số cơn hạ/tăng ĐH nặng
 *  - Tổng hợp tuân thủ thuốc + danh sách thuốc + nhật ký liều
 *  - Nhật ký đường huyết chi tiết
 *
 * Xuất hoàn toàn phía client => chi phí máy chủ = 0đ.
 * PDF: jspdf + jspdf-autotable (lazy-load). Excel: CSV UTF-8 BOM (không cần thư viện).
 */

const RANGE = { low: 3.9, highTIR: 10.0 }; // TIR 3.9–10.0 mmol/L (~70–180 mg/dL)

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDateVN(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function safeArr(v) {
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v || '[]'); return Array.isArray(p) ? p : []; } catch { return []; }
}
function typeLabel(t) {
  return ({
    glucose_fasting: 'ĐH đói',
    glucose_postmeal: 'ĐH sau ăn 2h',
    glucose_tolerance: 'Nghiệm pháp dung nạp',
    hba1c: 'HbA1c',
    c_peptide: 'C-peptide',
    blood_pressure: 'Huyết áp',
  })[t] || t;
}
function scheduleLabel(m) {
  if (m.schedule_type === 'every_n_days') return m.every_n_days === 2 ? 'Cách ngày' : `Mỗi ${m.every_n_days} ngày`;
  if (m.schedule_type === 'days_of_week') return 'Theo thứ trong tuần';
  if (m.schedule_type === 'as_needed') return 'Khi cần';
  return 'Hằng ngày';
}
function classifyGlucose(type, v) {
  if (v < RANGE.low) return 'Hạ ĐH';
  if (type === 'glucose_fasting') return v >= 7 ? (v > 13.9 ? 'Rất cao' : 'Cao') : 'Đạt';
  return v >= 10 ? (v > 13.9 ? 'Rất cao' : 'Cao') : 'Đạt';
}

export function buildReportModel({ patient, metrics, medications, medicationLogs, adherence, period }) {
  const glucose = (metrics || [])
    .filter((m) => (m.measurement_category || '').includes('glucose') || (m.measurement_type || '').includes('glucose'))
    .map((m) => ({ ...m, _v: Number(m.value) }))
    .filter((m) => Number.isFinite(m._v))
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));

  const values = glucose.map((g) => g._v);
  const n = values.length;
  const avg = n ? values.reduce((a, b) => a + b, 0) / n : null;
  const sd = n ? Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / n) : null;
  const cv = avg ? (sd / avg) * 100 : null;
  const eA1c = avg ? (avg * 18.0182 + 46.7) / 28.7 : null; // ADAG formula (Nathan 2008)
  const inRange = n ? (values.filter((v) => v >= RANGE.low && v <= RANGE.highTIR).length / n) * 100 : null;
  const hypoCount = values.filter((v) => v < RANGE.low).length;
  const severeHyperCount = values.filter((v) => v > 13.9).length;

  const hba1c = (metrics || [])
    .filter((m) => m.measurement_type === 'hba1c')
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))[0];

  return {
    patient: patient || {},
    period: period || '30 ngày gần nhất',
    generatedAt: new Date().toISOString(),
    glucose,
    stats: {
      count: n,
      averageMmol: avg ? +avg.toFixed(1) : null,
      sd: sd ? +sd.toFixed(1) : null,
      cvPercent: cv ? Math.round(cv) : null,
      estimatedA1c: eA1c ? +eA1c.toFixed(1) : null,
      labA1c: hba1c ? Number(hba1c.value) : null,
      timeInRangePercent: inRange != null ? Math.round(inRange) : null,
      hypoCount,
      severeHyperCount,
    },
    medications: medications || [],
    medicationLogs: medicationLogs || [],
    adherence: adherence || null,
  };
}

/* ─────────────── PDF ─────────────── */

export async function exportPdf(model) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 14;
  let y = M;

  doc.setFontSize(16).setFont(undefined, 'bold');
  doc.text('SỔ THEO DÕI ĐÁI THÁO ĐƯỜNG', 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10).setFont(undefined, 'normal');
  doc.text('Bản ghi bệnh nhân tự theo dõi qua ứng dụng DIA+', 105, y, { align: 'center' });
  y += 8;

  const p = model.patient || {};
  doc.autoTable({
    startY: y,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Họ tên:', p.name || '—', 'Ngày sinh:', p.date_of_birth || '—'],
      ['CCCD:', p.cccd || '—', 'Nhóm máu:', p.blood_type || '—'],
      ['Chẩn đoán:', p.diagnosis || '—', 'Dị ứng:', p.allergies || 'Không'],
      ['Kỳ báo cáo:', model.period, 'Xuất lúc:', fmtDateVN(model.generatedAt)],
    ],
  });
  y = doc.lastAutoTable.finalY + 6;

  const s = model.stats;
  doc.setFont(undefined, 'bold').setFontSize(11).text('1. TỔNG QUAN KIỂM SOÁT ĐƯỜNG HUYẾT', M, y);
  doc.autoTable({
    startY: y + 2,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [27, 95, 166] },
    head: [['Chỉ số', 'Giá trị', 'Tham chiếu']],
    body: [
      ['Số lần đo', String(s.count), '—'],
      ['ĐH trung bình', s.averageMmol != null ? `${s.averageMmol} mmol/L` : '—', '4.4 – 7.2 (đói)'],
      ['Độ lệch chuẩn (SD)', s.sd != null ? `${s.sd}` : '—', '< 2.0'],
      ['Độ biến thiên (CV%)', s.cvPercent != null ? `${s.cvPercent}%` : '—', '≤ 36% (ổn định)'],
      ['HbA1c ước tính (eA1c)', s.estimatedA1c != null ? `${s.estimatedA1c}%` : '—', '< 7.0% (đa số BN)'],
      ['HbA1c xét nghiệm', s.labA1c != null ? `${s.labA1c}%` : 'chưa có', '< 7.0%'],
      ['Thời gian trong ngưỡng (TIR 3.9–10)', s.timeInRangePercent != null ? `${s.timeInRangePercent}%` : '—', '> 70%'],
      ['Số lần hạ đường huyết (<3.9)', String(s.hypoCount), '0'],
      ['Số lần tăng ĐH nặng (>13.9)', String(s.severeHyperCount), '0'],
    ],
  });
  y = doc.lastAutoTable.finalY + 6;

  if (model.adherence) {
    const a = model.adherence;
    doc.setFont(undefined, 'bold').setFontSize(11).text('2. TUÂN THỦ DÙNG THUỐC', M, y);
    doc.autoTable({
      startY: y + 2,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [27, 95, 166] },
      head: [['Chỉ số', 'Giá trị']],
      body: [
        ['Điểm tuân thủ chung', a.adherencePercent != null ? `${a.adherencePercent}%` : '—'],
        ['Số liều kỳ vọng', String(a.expectedDoses)],
        ['Số liều đã uống', String(a.takenDoses)],
        ['Số liều bỏ lỡ', String(a.missedDoses)],
        ['Đánh giá', a.isPoorAdherence ? 'KÉM (< 75%) — cần can thiệp' : 'Đạt'],
      ],
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  doc.setFont(undefined, 'bold').setFontSize(11).text('3. DANH SÁCH THUỐC ĐANG DÙNG', M, y);
  doc.autoTable({
    startY: y + 2,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [27, 95, 166] },
    head: [['Tên thuốc', 'Hàm lượng', 'Lịch dùng', 'Giờ uống', 'Bác sĩ kê']],
    body: (model.medications || []).map((m) => [
      m.name,
      m.dosage || '—',
      scheduleLabel(m),
      (Array.isArray(m.times) ? m.times : safeArr(m.times)).join(', '),
      m.doctor_name || '—',
    ]),
  });

  doc.addPage();
  y = M;
  doc.setFont(undefined, 'bold').setFontSize(11).text('4. NHẬT KÝ ĐƯỜNG HUYẾT CHI TIẾT', M, y);
  doc.autoTable({
    startY: y + 2,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [27, 95, 166] },
    head: [['Thời điểm', 'Loại', 'Giá trị (mmol/L)', 'Phân loại', 'Ghi chú']],
    body: model.glucose.map((g) => [
      fmtDateVN(g.measured_at),
      typeLabel(g.measurement_type),
      String(g.value),
      classifyGlucose(g.measurement_type, Number(g.value)),
      g.note || '',
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const t = data.cell.raw;
        if (t === 'Hạ ĐH' || t === 'Rất cao') data.cell.styles.textColor = [220, 38, 38];
        else if (t === 'Cao') data.cell.styles.textColor = [217, 119, 6];
        else if (t === 'Đạt') data.cell.styles.textColor = [22, 163, 74];
      }
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (y > 250) { doc.addPage(); y = M; }
  doc.setFontSize(9).setFont(undefined, 'italic');
  doc.text('Bản ghi tự theo dõi, không thay thế chẩn đoán của bác sĩ. Nguồn: ứng dụng DIA+.', M, y);
  y += 12;
  doc.setFont(undefined, 'normal');
  doc.text('Xác nhận của bác sĩ điều trị: ......................................................', M, y);
  y += 10;
  doc.text('Ký, ghi rõ họ tên & ngày:', M, y);

  const fname = `DIA+_So_theo_doi_${(p.name || 'benh_nhan').replace(/\s+/g, '_')}_${model.generatedAt.slice(0, 10)}.pdf`;
  doc.save(fname);
}

/* ─────────────── Excel (CSV UTF-8 BOM) ─────────────── */

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv(model) {
  const rows = [];
  rows.push(['SỔ THEO DÕI ĐÁI THÁO ĐƯỜNG — DIA+']);
  rows.push(['Bệnh nhân', model.patient?.name || '', 'CCCD', model.patient?.cccd || '']);
  rows.push(['Kỳ báo cáo', model.period, 'Xuất lúc', fmtDateVN(model.generatedAt)]);
  rows.push([]);
  rows.push(['— THỐNG KÊ —']);
  const s = model.stats;
  rows.push(['ĐH trung bình (mmol/L)', s.averageMmol ?? '']);
  rows.push(['Độ lệch chuẩn', s.sd ?? '']);
  rows.push(['CV%', s.cvPercent ?? '']);
  rows.push(['HbA1c ước tính (%)', s.estimatedA1c ?? '']);
  rows.push(['HbA1c xét nghiệm (%)', s.labA1c ?? '']);
  rows.push(['TIR 3.9–10 (%)', s.timeInRangePercent ?? '']);
  rows.push(['Số lần hạ ĐH', s.hypoCount]);
  rows.push(['Số lần tăng ĐH nặng', s.severeHyperCount]);
  if (model.adherence) rows.push(['Tuân thủ thuốc (%)', model.adherence.adherencePercent ?? '']);
  rows.push([]);
  rows.push(['— NHẬT KÝ ĐƯỜNG HUYẾT —']);
  rows.push(['Thời điểm', 'Loại', 'Giá trị (mmol/L)', 'Phân loại', 'Ghi chú']);
  model.glucose.forEach((g) =>
    rows.push([
      fmtDateVN(g.measured_at),
      typeLabel(g.measurement_type),
      g.value,
      classifyGlucose(g.measurement_type, Number(g.value)),
      g.note || '',
    ]),
  );
  rows.push([]);
  rows.push(['— NHẬT KÝ UỐNG THUỐC —']);
  rows.push(['Thời điểm theo lịch', 'Thuốc', 'Cữ', 'Trạng thái', 'Trễ (phút)']);
  (model.medicationLogs || []).forEach((l) =>
    rows.push([
      fmtDateVN(l.scheduled_for),
      l.medication_name || '',
      l.slot_time,
      { taken: 'Đã uống', skipped: 'Bỏ qua', missed: 'Quên' }[l.status] || l.status,
      l.delay_minutes ?? '',
    ]),
  );

  const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DIA+_So_theo_doi_${model.generatedAt.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
