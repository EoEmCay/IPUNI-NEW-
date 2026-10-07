// Dựng bộ benchmark 3 cấp độ + ground_truth.json. Chạy 1 lần, kết quả đã commit sẵn.
//   node test_prescriptions/build_dataset.js <thư mục test/ của chinmays18/medical-prescription-dataset>
// Cần ImageMagick (`magick`) và font Snell Roundhand / Arial của macOS.
//
// Nguồn ảnh:
//  - HF: ảnh + annotation gốc của dataset (chữ viết tay tổng hợp, tiếng Anh) -> đáp án lấy nguyên từ annotation.
//  - VN: đơn ĐTĐ tiếng Việt có tốc ký (1v x 2l/ng, s-c, u.s.a, đv...) render bằng font viết tay -> đáp án do ta viết.
// Cấp độ do mức suy giảm ảnh quyết định (nghiêng, nhoè, mực mờ, nhiễu, độ phân giải thấp, nén JPEG),
// vì dataset HF dùng chung 1 kiểu chữ cho mọi ảnh.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const hfDir = process.argv[2];
if (!hfDir) throw new Error('Thiếu đường dẫn tới thư mục test/ của dataset HF');
const OUT = __dirname;
const FONT_HAND = '/System/Library/Fonts/Supplemental/SnellRoundhand.ttc';
const FONT_PRINT = '/System/Library/Fonts/Supplemental/Arial.ttf';

const DEGRADE = {
  level_1_easy: [],
  level_2_medium: ['-background', 'white', '-rotate', '2.5', '-blur', '0x0.8'],
  level_3_hard: ['-background', 'white', '-rotate', '-4', '-blur', '0x1.5', '+level', '35%,100%',
    '-attenuate', '0.6', '+noise', 'Gaussian', '-resize', '60%', '-quality', '40'],
};
const EXT = { level_1_easy: 'png', level_2_medium: 'png', level_3_hard: 'jpg' };

const HF_PICKS = {
  level_1_easy: ['00025', '00027', '00046'], // 1-2 thuốc
  level_2_medium: ['00094', '00104', '00127'], // 3 thuốc
  level_3_hard: ['00030', '00044', '00071'], // 4 thuốc
};

// Đơn ĐTĐ tiếng Việt: `lines` = chữ viết tay đúng như bác sĩ ghi, `gt` = đáp án.
const med = (name, aliases, dosage, quantity, instructions, times) => ({ name, aliases, dosage, quantity, instructions, times });
const VN = {
  level_1_easy: [
    {
      id: 'vn_01', hospital: 'BỆNH VIỆN NỘI TIẾT TRUNG ƯƠNG', doctor: 'BS. Nguyễn Văn An', date: '2026-09-15',
      lines: ['1. Metformin 500mg    SL: 60v', '    1v x 2l/ng  s - c  u.s.a',
        '2. Diamicron MR 30mg    SL: 30v', '    1v sáng  u.t.a 30p'],
      meds: [
        med('Metformin', [], '500 mg', '60 viên', 'Uống 1 viên x 2 lần/ngày, sáng - chiều, sau ăn', ['07:00', '16:00']),
        med('Gliclazide', ['Diamicron MR'], '30 mg', '30 viên', 'Uống 1 viên buổi sáng, trước ăn 30 phút', ['07:00']),
      ],
    },
    {
      id: 'vn_02', hospital: 'PHÒNG KHÁM ĐA KHOA HÒA BÌNH', doctor: 'BS. Trần Thị Mai', date: '2026-08-20',
      lines: ['1. Lantus SoloStar    SL: 1 bút', '    TDD 12 đv  tối 21h',
        '2. Januvia 100mg    SL: 28v', '    1v sáng'],
      meds: [
        med('Insulin glargine', ['Lantus', 'Lantus SoloStar'], '12 IU', '1 bút tiêm', 'Tiêm dưới da 12 đơn vị buổi tối lúc 21h', ['21:00']),
        med('Sitagliptin', ['Januvia'], '100 mg', '28 viên', 'Uống 1 viên buổi sáng', ['07:00']),
      ],
    },
  ],
  level_2_medium: [
    {
      id: 'vn_03', hospital: 'BỆNH VIỆN BẠCH MAI', doctor: 'BS. Lê Hoàng Nam', date: '2026-09-02',
      lines: ['1. Amaryl 2mg    SL: 30v', '    1v s  u.t.a',
        '2. Metformin 850mg    SL: 60v', '    1v x 2l/ng  s-c  u.s.a',
        '3. Atorvastatin 20mg    SL: 30v', '    1v  u.t.n'],
      meds: [
        med('Glimepiride', ['Amaryl'], '2 mg', '30 viên', 'Uống 1 viên buổi sáng, trước ăn', ['07:00']),
        med('Metformin', [], '850 mg', '60 viên', 'Uống 1 viên x 2 lần/ngày, sáng - chiều, sau ăn', ['07:00', '16:00']),
        med('Atorvastatin', [], '20 mg', '30 viên', 'Uống 1 viên trước khi đi ngủ', ['21:30']),
      ],
    },
    {
      id: 'vn_04', hospital: 'BỆNH VIỆN CHỢ RẪY', doctor: 'BS. Phạm Minh Đức', date: '2026-07-11',
      lines: ['1. NovoMix 30 FlexPen    SL: 2 bút', '    TDD 14 đv x 2l/ng  s-c  t.a 15p',
        '2. Jardiance 10mg    SL: 30v', '    1v s',
        '3. Losartan 50mg    SL: 30v', '    1v s'],
      meds: [
        med('Insulin aspart 30/70', ['NovoMix 30', 'NovoMix 30 FlexPen', 'NovoMix'], '14 IU', '2 bút tiêm', 'Tiêm dưới da 14 đơn vị x 2 lần/ngày, sáng - chiều, trước ăn 15 phút', ['07:00', '16:00']),
        med('Empagliflozin', ['Jardiance'], '10 mg', '30 viên', 'Uống 1 viên buổi sáng', ['07:00']),
        med('Losartan', [], '50 mg', '30 viên', 'Uống 1 viên buổi sáng', ['07:00']),
      ],
    },
  ],
  level_3_hard: [
    {
      id: 'vn_05', hospital: 'BỆNH VIỆN NỘI TIẾT TP.HCM', doctor: 'BS. Võ Thanh Tùng', date: '2026-09-28',
      lines: ['1. Diamicron MR 60mg    SL: 30v', '    1v s  u.t.a',
        '2. Lantus    SL: 1 bút', '    TDD 18U  t 21h',
        '3. Metformin 1000mg    SL: 60v', '    1v x 2  s-c  u.s.a'],
      meds: [
        med('Gliclazide', ['Diamicron MR'], '60 mg', '30 viên', 'Uống 1 viên buổi sáng, trước ăn', ['07:00']),
        med('Insulin glargine', ['Lantus'], '18 IU', '1 bút tiêm', 'Tiêm dưới da 18 đơn vị buổi tối lúc 21h', ['21:00']),
        med('Metformin', [], '1000 mg', '60 viên', 'Uống 1 viên x 2 lần/ngày, sáng - chiều, sau ăn', ['07:00', '16:00']),
      ],
    },
    {
      id: 'vn_06', hospital: 'PHÒNG KHÁM TÂM ĐỨC', doctor: 'BS. Hồ Thị Lan', date: '2026-09-30',
      lines: ['1. NovoNorm 0.5mg    SL: 90v', '    1v x 3l/ng  t.a 15p',
        '2. Forxiga 10mg    SL: 30v', '    1v s',
        '3. Rosuvastatin 10mg    SL: 30v', '    1v t'],
      meds: [
        med('Repaglinide', ['NovoNorm'], '0.5 mg', '90 viên', 'Uống 1 viên x 3 lần/ngày, trước ăn 15 phút', ['07:00', '12:00', '19:00']),
        med('Dapagliflozin', ['Forxiga'], '10 mg', '30 viên', 'Uống 1 viên buổi sáng', ['07:00']),
        med('Rosuvastatin', [], '10 mg', '30 viên', 'Uống 1 viên buổi tối', ['19:00']),
      ],
    },
  ],
};

// "<s_ocr> doctor_name: Dr. X clinic_name: ... date: 2024-12-16 medications: - Metformin 250 mg - After meals signature: ..."
function parseHfAnnotation(file) {
  const s = JSON.parse(fs.readFileSync(file, 'utf-8')).ground_truth;
  const field = (k, next) => (new RegExp(`${k}: (.*?) ${next}:`).exec(s) || [])[1] || null;
  const medsText = field('medications', 'signature') || '';
  const meds = [...medsText.matchAll(/- (\S+) (\d+(?:\.\d+)?) (mg) - (.+?)(?= - [A-Z][a-z]+ \d|$)/g)]
    .map(m => med(m[1], [], `${m[2]} ${m[3]}`, null, m[4].trim(), null));
  return {
    doctor_name: field('doctor_name', 'clinic_name'),
    hospital_name: field('clinic_name', 'clinic_address'),
    date: field('date', 'medications'),
    medications: meds,
  };
}

function renderVn(rx, outFile, degrade) {
  const args = ['-size', '1000x1250', 'xc:#f7f6f1', '-fill', '#1a1a1a',
    '-font', FONT_PRINT, '-pointsize', '30', '-annotate', '+60+80', rx.hospital,
    '-pointsize', '26', '-annotate', '+60+125', 'ĐƠN THUỐC',
    '-fill', '#1f2a5c', '-font', FONT_HAND, '-pointsize', '40',
    '-annotate', '+60+200', `Chẩn đoán: ĐTĐ type 2`,
    '-annotate', '+60+260', `Ngày: ${rx.date.split('-').reverse().join('/')}`];
  rx.lines.forEach((line, i) => args.push('-annotate', `+60+${360 + i * 70}`, line));
  args.push('-annotate', `+560+${420 + rx.lines.length * 70}`, rx.doctor, ...degrade, outFile);
  execFileSync('magick', args);
}

// Giữ đáp án các ảnh đơn thật (source 'real...') đã thêm tay vào ground_truth.json.
const GT_FILE = path.join(OUT, 'ground_truth.json');
const groundTruth = Object.fromEntries(Object.entries(fs.existsSync(GT_FILE) ? JSON.parse(fs.readFileSync(GT_FILE, 'utf-8')) : {})
  .filter(([, v]) => String(v.source).startsWith('real')));
for (const level of Object.keys(DEGRADE)) {
  const dir = path.join(OUT, level);
  fs.mkdirSync(dir, { recursive: true });
  // Chỉ xoá ảnh do script này tạo (rx_*, vn_*) - ảnh đơn thật thêm tay (real_*) giữ nguyên.
  for (const f of fs.readdirSync(dir)) if (/^(rx|vn)_.*\.(png|jpg)$/.test(f)) fs.unlinkSync(path.join(dir, f));

  for (const id of HF_PICKS[level]) {
    const file = `${level}/rx_${id}.${EXT[level]}`;
    execFileSync('magick', [path.join(hfDir, `images/prescription_${id}.png`), ...DEGRADE[level], path.join(OUT, file)]);
    groundTruth[file] = { source: 'hf:chinmays18/medical-prescription-dataset', ...parseHfAnnotation(path.join(hfDir, `annotations/prescription_${id}.json`)) };
  }
  for (const rx of VN[level]) {
    const file = `${level}/${rx.id}.${EXT[level]}`;
    renderVn(rx, path.join(OUT, file), DEGRADE[level]);
    groundTruth[file] = { source: 'synthetic-vn-diabetes', doctor_name: rx.doctor, hospital_name: rx.hospital, date: rx.date, medications: rx.meds };
  }
}
fs.writeFileSync(GT_FILE, JSON.stringify(groundTruth, null, 2) + '\n');
console.log(`Đã tạo ${Object.keys(groundTruth).length} ảnh + ground_truth.json`);
