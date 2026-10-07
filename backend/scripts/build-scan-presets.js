// Dựng src/modules/scan/scanPresets.json (đơn mẫu trả kết quả tức thì cho buổi thi/demo).
// Nguồn: kết quả quét đã lưu trong test_prescriptions/<RESULTS_DIR> + ảnh tương ứng.
// Chỉ lấy ảnh ĐÃ commit (dataset công khai/ảnh tổng hợp) - ảnh đơn thật chỉ ở máy nên bị bỏ qua.
// Chạy: node scripts/build-scan-presets.js [results_dir]   (mặc định results_llm_0710)
// Thêm đơn riêng: node scripts/build-scan-presets.js results_llm_0710 duong/dan/anh.jpg ket_qua.json ...
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fingerprint, similarity } = require('../src/modules/scan/scanPresets');

const ROOT = path.join(__dirname, '..', 'test_prescriptions');
const OUT = path.join(__dirname, '..', 'src', 'modules', 'scan', 'scanPresets.json');
const [resultsDir = 'results_llm_0710', ...extra] = process.argv.slice(2);
// Kết quả AI đọc SAI so với ground_truth.json (đã đối chiếu 07/10/2026) -> không làm đơn mẫu,
// nếu không app sẽ trả liều sai NGAY LẬP TỨC. Ảnh này vẫn quét bằng AI như thường.
const SKIP = new Set([
  'level_3_hard/rx_00030.jpg', // Amoxicillin 500mg (đúng 50mg), thiếu Gabapentin
  'level_3_hard/rx_00044.jpg', // Lisinopril 20mg (đúng 25mg), thiếu Amoxicillin
  'level_3_hard/rx_00071.jpg', // đọc ra thuốc khác hẳn đơn
]);

const tracked = new Set(execSync('git ls-files test_prescriptions', { cwd: path.join(__dirname, '..') })
  .toString().split('\n').map((f) => f.replace(/^test_prescriptions\//, '')));

(async () => {
  const pairs = [];
  for (const f of fs.readdirSync(path.join(ROOT, resultsDir)).filter((n) => n.endsWith('.json'))) {
    const rel = f.replace(/\.json$/, '').replace('__', '/');
    if (!tracked.has(rel)) { console.log(`bỏ qua (ảnh không commit): ${rel}`); continue; }
    if (SKIP.has(rel)) { console.log(`bỏ qua (AI đọc sai): ${rel}`); continue; }
    pairs.push([rel, path.join(ROOT, rel), path.join(ROOT, resultsDir, f)]);
  }
  for (let i = 0; i + 1 < extra.length; i += 2) pairs.push([path.basename(extra[i]), extra[i], extra[i + 1]]);

  const presets = [];
  for (const [label, img, res] of pairs) {
    const result = JSON.parse(fs.readFileSync(res, 'utf8'));
    if (!result.isPrescription && !result.isDiabetesPrescription) { console.log(`bỏ qua (không phải đơn): ${label}`); continue; }
    const buf = fs.readFileSync(img);
    presets.push({ label, sha256: crypto.createHash('sha256').update(buf).digest('hex'), fp: await fingerprint(buf), result });
  }

  // Báo 2 đơn mẫu giống nhau nhất: phải thấp hơn hẳn ngưỡng khớp (0.97), không thì dễ nhận nhầm
  let max = -1, pair = '';
  for (let i = 0; i < presets.length; i++) for (let j = i + 1; j < presets.length; j++) {
    const s = similarity(presets[i].fp, presets[j].fp);
    if (s > max) { max = s; pair = `${presets[i].label} ~ ${presets[j].label}`; }
  }
  fs.writeFileSync(OUT, `${JSON.stringify(presets, null, 1)}\n`);
  console.log(`${presets.length} đơn mẫu -> ${path.relative(process.cwd(), OUT)}; 2 đơn giống nhau nhất: ${max.toFixed(3)} (${pair})`);
})();
