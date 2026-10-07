// Chấm điểm analyzePrescription() trên bộ ảnh 3 cấp độ so với ground_truth.json.
//   node test_prescriptions/evaluate_benchmark.js            -> chạy AI thật, lưu kết quả thô vào results/
//   node test_prescriptions/evaluate_benchmark.js --cached   -> chấm lại từ results/ (không gọi API)
//   node test_prescriptions/evaluate_benchmark.js --selftest -> tự kiểm tra hàm chấm điểm
//   --resume                                                 -> chỉ chạy lại ảnh chưa có kết quả / lỗi API
//   --engine llm|trocr|ensemble                              -> chỉ Gemini (mặc định) / chỉ TrOCR / TrOCR gợi ý cho Gemini
//   --service <file.js> --out <thư mục>                      -> chấm 1 bản scan.service khác (vd bản gốc để so sánh)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const assert = require('assert');

const LEVELS = { level_1_easy: 'Dễ', level_2_medium: 'Trung bình', level_3_hard: 'Khó' };
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const RESULTS_DIR = path.resolve(arg('--out') || path.join(__dirname, 'results'));
const ENGINE = arg('--engine') || 'llm';
if (!['llm', 'trocr', 'ensemble'].includes(ENGINE)) throw new Error(`--engine không hợp lệ: ${ENGINE}`);
process.env.TROCR_ENABLED = ENGINE === 'llm' ? '0' : '1';
process.env.SCAN_ENGINE = ENGINE;
const SERVICE = path.resolve(arg('--service') || path.join(__dirname, '../src/modules/scan/scan.service.js'));

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

function levenshteinRatio(a, b) {
  if (!a.length || !b.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

// Tên đúng nếu khớp tên gốc hoặc biệt dược (gần đúng 1 lỗi gõ cho tên dài) - có chứa nhau thì cũng tính.
function nameMatches(predName, gt) {
  const p = norm(predName).replace(/[^a-z0-9/ ]/g, ' ').trim();
  if (!p) return false;
  return [gt.name, ...(gt.aliases || [])].some(n => {
    const g = norm(n).trim();
    return p === g || p.startsWith(g + ' ') || g.startsWith(p + ' ') || p.includes(` ${g} `) ||
      p.split(/\s+/).some(w => w.length >= 6 && levenshteinRatio(w, g) >= 0.9);
  });
}

// "0,5 mg" -> {value: 0.5, unit: 'mg'}; "18 đơn vị" / "18U" / "18 UI" -> {value: 18, unit: 'iu'}
function parseDose(text) {
  const m = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|ml|iu|ui|u|units?|dv|don vi)\b/.exec(norm(text));
  if (!m) return null;
  return { value: parseFloat(m[1].replace(',', '.')), unit: /^(iu|ui|u|units?|dv|don vi)$/.test(m[2]) ? 'iu' : m[2] };
}

// Mọi liều có trong chuỗi ("sáng 28 đơn vị, chiều 26 đơn vị" -> 2 liều)
const allDoses = text => [...norm(text).matchAll(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|ml|iu|ui|u|units?|dv|don vi)\b/g)].map(m => parseDose(m[0]));

function dosageMatches(pred, gt) {
  // Liều khác nhau theo cữ (insulin sáng 28 / chiều 26): phải đọc đủ mọi liều, ở bất kỳ trường nào.
  if (gt.doses) {
    const found = allDoses(`${pred.dosage || ''} ${pred.amountPerDose || ''} ${pred.instructions || ''} ${pred.frequency || ''}`);
    return gt.doses.map(parseDose).every(g => found.some(p => p.value === g.value && p.unit === g.unit));
  }
  const g = parseDose(gt.dosage);
  const p = parseDose(pred.dosage) || parseDose(pred.name);
  return !!(g && p && g.value === p.value && g.unit === p.unit);
}

// Quy cách dùng về các nhãn chuẩn, nhận cả tiếng Anh lẫn tiếng Việt (AI trả lời bằng tiếng Việt).
const INSTRUCTION_TAGS = {
  after_meal: /after meal|sau (khi |bua )?an|\bu\.?s\.?a\b/,
  before_meal: /before meal|truoc (khi |bua )?an|\bu?\.?t\.?a\b/,
  with_food: /with food|cung (voi )?(bua an|thuc an)|trong (bua )?an|kem (bua an|thuc an)|(?<!truoc |sau )khi an/,
  bedtime: /bedtime|truoc (khi )?(di )?ngu|luc (di )?ngu|\bu\.?t\.?n\b/,
  q8h: /every 8|8 (gio|tieng)/,
  q12h: /every 12|12 (gio|tieng)/,
  once_daily: /once daily|1 lan\s*(\/|moi|mot|trong)?\s*ngay|ngay (uong )?1 lan|mot lan (moi |mot )?ngay/,
  twice_daily: /twice daily|2 lan\s*(\/|moi|mot|trong)?\s*ngay|ngay (uong )?2 lan|hai lan/,
  thrice_daily: /3 lan\s*(\/|moi|mot|trong)?\s*ngay|ngay (uong )?3 lan|ba lan/,
  as_needed: /as needed|khi can|khi (bi )?dau/,
  as_directed: /as directed|theo (chi dan|huong dan|chi dinh|loi dan)/,
  injection: /tiem|inject|duoi da/,
};
const instructionTags = text => Object.keys(INSTRUCTION_TAGS).filter(k => INSTRUCTION_TAGS[k].test(norm(text)));

const toMinutes = t => { const m = /(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
// Giờ đúng nếu cùng số cữ và mỗi giờ chuẩn có 1 giờ dự đoán lệch không quá 2 tiếng.
function timesMatch(predTimes, gtTimes) {
  if (!gtTimes) return true;
  const p = (predTimes || []).map(toMinutes).filter(v => v != null);
  return p.length === gtTimes.length && gtTimes.every(t => p.some(v => Math.abs(v - toMinutes(t)) <= 120));
}

function instructionsMatch(pred, gt) {
  const predTags = instructionTags(`${pred.instructions || ''} ${pred.frequency || ''}`);
  return instructionTags(gt.instructions).every(t => predTags.includes(t)) && timesMatch(pred.times, gt.times);
}

function scorePrescription(result, gt) {
  const preds = [...((result && result.medications) || [])];
  const meds = gt.medications.map(g => {
    const i = preds.findIndex(p => nameMatches(p.name, g));
    const p = i >= 0 ? preds.splice(i, 1)[0] : null;
    return {
      gt: g.name, read: p ? p.name : null,
      // null = đơn không ghi trường này -> không chấm (không tính vào mẫu số)
      name: !!p,
      dosage: g.dosage || g.doses ? !!p && dosageMatches(p, g) : null,
      instructions: g.instructions ? !!p && instructionsMatch(p, g) : null,
      readDosage: p && p.dosage, readInstructions: p && `${p.instructions || ''} | ${(p.times || []).join(',')}`,
    };
  });
  const allFields = meds.every(m => m.name && m.dosage !== false && m.instructions !== false);
  return { meds, extra: preds.map(p => p.name), success: allFields && preds.length === 0 };
}

const pct = (n, d) => (d ? (100 * n / d).toFixed(1) + '%' : '-');

function report(gtAll, results) {
  const rows = [];
  const failures = [];
  for (const [level, label] of Object.entries(LEVELS)) {
    const files = Object.keys(gtAll).filter(f => f.startsWith(level));
    const n = { meds: 0, name: 0, dosage: 0, dosageOf: 0, instr: 0, instrOf: 0, success: 0, seconds: [] };
    for (const f of files) {
      const s = scorePrescription(results[f], gtAll[f]);
      for (const m of s.meds) {
        n.meds++; n.name += m.name;
        if (m.dosage !== null) { n.dosageOf++; n.dosage += m.dosage; }
        if (m.instructions !== null) { n.instrOf++; n.instr += m.instructions; }
        if (!m.name || m.dosage === false || m.instructions === false) failures.push({ file: f, ...m });
      }
      if (s.extra.length) failures.push({ file: f, extra: s.extra });
      n.success += s.success;
      if (results[f] && results[f]._seconds) n.seconds.push(results[f]._seconds);
    }
    const fields = n.meds + n.dosageOf + n.instrOf;
    const avgSec = n.seconds.length ? (n.seconds.reduce((a, b) => a + b, 0) / n.seconds.length).toFixed(1) + 's' : '-';
    rows.push(`| ${label} | ${files.length} | ${n.meds} | ${pct(n.name, n.meds)} | ${pct(n.dosage, n.dosageOf)} | ${pct(n.instr, n.instrOf)} | ${pct(n.name + n.dosage + n.instr, fields)} | ${pct(n.success, files.length)} | ${avgSec} |`);
  }
  console.log('\n| Cấp độ | Số đơn | Số thuốc | Drug Name Match | Dosage & Amount | Instructions & Timing | Field Accuracy (3 trường) | Total Prescription Success | Thời gian/ảnh |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  console.log(rows.join('\n'));
  console.log('\n### Các trường đọc sai');
  for (const f of failures) {
    console.log(f.extra ? `- ${f.file}: thừa thuốc ${JSON.stringify(f.extra)}`
      : `- ${f.file}: ${f.gt} -> đọc "${f.read}" | liều "${f.readDosage}" ${f.dosage ? '✓' : '✗'} | cách dùng "${f.readInstructions}" ${f.instructions ? '✓' : '✗'}`);
  }
}

async function main() {
  const gtAll = JSON.parse(fs.readFileSync(path.join(__dirname, 'ground_truth.json'), 'utf-8'));
  const cached = process.argv.includes('--cached');
  const resume = process.argv.includes('--resume');
  const results = {};
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const { analyzePrescription } = cached ? {} : require(SERVICE);
  // Ghi lại model nào thực sự trả lời (chuỗi fallback Gemini đổi model khi bị 503).
  const logger = require('../src/utils/logger');
  let model = null;
  const info = logger.info;
  logger.info = msg => { const m = /\(([\w.-]+)\) thành công/.exec(msg); if (m) model = m[1]; };

  // Ảnh đơn thật (real_*) không commit lên repo - máy nào không có thì bỏ qua.
  for (const f of Object.keys(gtAll)) {
    if (!fs.existsSync(path.join(__dirname, f))) { console.log(`[Benchmark] Bỏ qua ${f} (không có ảnh trên máy này)`); delete gtAll[f]; }
  }
  for (const file of Object.keys(gtAll)) {
    const out = path.join(RESULTS_DIR, file.replace(/\//g, '__') + '.json');
    const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf-8')) : null;
    if (cached || (resume && prev)) { results[file] = prev; continue; }
    const t = Date.now();
    model = null;
    try {
      const mime = file.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      results[file] = await analyzePrescription(fs.readFileSync(path.join(__dirname, file)), mime, 'vi');
    } catch (err) {
      console.error(`[Benchmark] ${file} lỗi: ${err.message}`);
      results[file] = null;
    }
    if (results[file]) { results[file]._model = model; results[file]._seconds = +((Date.now() - t) / 1000).toFixed(1); }
    fs.writeFileSync(out, JSON.stringify(results[file], null, 2));
    console.log(`[Benchmark] ${file} xong sau ${((Date.now() - t) / 1000).toFixed(1)}s (${model})`);
  }
  logger.info = info;
  report(gtAll, results);
}

function selftest() {
  const gt = { name: 'Gliclazide', aliases: ['Diamicron MR'], dosage: '30 mg', instructions: 'Uống 1 viên buổi sáng, trước ăn 30 phút', times: ['07:00'] };
  assert(nameMatches('Diamicron MR', gt) && nameMatches('Gliclazide (Diamicron MR)', gt) && !nameMatches('Glipizide', gt));
  assert(dosageMatches({ dosage: '30mg' }, gt) && !dosageMatches({ dosage: '300mg' }, gt));
  assert(dosageMatches({ dosage: '18 đơn vị' }, { dosage: '18 IU' }) && !dosageMatches({ dosage: '180 IU' }, { dosage: '18 IU' }));
  assert(dosageMatches({ dosage: '0,5 mg' }, { dosage: '0.5 mg' }) && !dosageMatches({ dosage: '5mg' }, { dosage: '0.5 mg' }));
  assert(instructionsMatch({ instructions: 'Uống 1 viên sáng trước bữa ăn 30 phút', times: ['06:30'] }, gt));
  assert(!instructionsMatch({ instructions: 'Uống sau ăn', times: ['07:00'] }, gt));
  assert(instructionsMatch({ instructions: 'Uống 2 lần/ngày sau ăn', times: ['07:00', '17:00'] },
    { instructions: 'Uống 1 viên x 2 lần/ngày, sáng - chiều, sau ăn', times: ['07:00', '16:00'] }));
  assert(instructionsMatch({ instructions: 'Uống khi cần thiết để giảm đau' }, { instructions: 'As needed for pain', times: null }));
  assert(scorePrescription({ medications: [{ name: 'Diamicron MR', dosage: '30mg', instructions: 'trước ăn', times: ['07:00'] }] },
    { medications: [gt] }).success);
  // Liều theo cữ + trường đơn không ghi thì không chấm
  const ins = { name: 'Insulin 30/70', dosage: null, doses: ['28 IU', '26 IU'], instructions: 'Tiêm dưới da sáng 28 đơn vị, chiều 26 đơn vị', times: ['07:00', '16:00'] };
  assert(dosageMatches({ dosage: '30/70', amountPerDose: '28 đơn vị sáng, 26 đơn vị chiều' }, ins));
  assert(!dosageMatches({ dosage: '30/70', amountPerDose: '28 đơn vị sáng, 20 đơn vị chiều' }, ins));
  const r = scorePrescription({ medications: [{ name: 'Glucophage' }] }, { medications: [{ name: 'Glucophage', dosage: null, instructions: null }] });
  assert(r.meds[0].dosage === null && r.meds[0].instructions === null && r.success);
  console.log('selftest OK');
}

if (process.argv.includes('--selftest')) selftest();
else main();
