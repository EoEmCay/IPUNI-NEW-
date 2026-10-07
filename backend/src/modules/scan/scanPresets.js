'use strict';
// Đơn mẫu cho buổi thi/demo: ảnh khớp 1 đơn mẫu -> trả ngay kết quả đã quét sẵn (dưới 1 giây)
// thay vì chờ AI. Đối chiếu = độ tương quan của ảnh xám 64x64 (đo trên bộ test_prescriptions:
// cùng file sau khi app nén lại 1600px >= 0.998; hai đơn KHÁC nhau <= 0.86).
// AN TOÀN: chỉ dùng cho tài khoản dùng thử (controller kiểm tra) + ngưỡng 0.97 + phải bỏ xa đơn
// mẫu thứ hai -> đơn thật của người bệnh không bao giờ nhận nhầm liều của đơn mẫu.
// ponytail: ảnh CHỤP LẠI tờ đơn (lệch góc/sáng) không khớp được bằng cách này (~0.72-0.84) -> chạy AI
// như cũ; muốn khớp ảnh chụp cần so điểm đặc trưng (ORB + homography) hoặc so chữ OCR.
const crypto = require('crypto');
const { Jimp } = require('jimp');
const PRESETS = require('./scanPresets.json');

const N = 64;
const MIN_SIMILARITY = 0.97;
const MIN_MARGIN = 0.05; // đơn mẫu giống thứ hai phải kém hơn ít nhất chừng này

// Ảnh -> chuỗi base64 của ảnh xám NxN (thu nhỏ từng nửa để mỗi điểm là trung bình cả vùng)
async function fingerprint(buffer) {
  const img = await Jimp.read(buffer);
  img.greyscale();
  while (img.bitmap.width / 2 >= N * 4) img.resize({ w: Math.round(img.bitmap.width / 2), h: Math.round(img.bitmap.height / 2) });
  img.resize({ w: N, h: N });
  const grey = Buffer.alloc(N * N);
  for (let i = 0; i < N * N; i++) grey[i] = img.bitmap.data[i * 4];
  return grey.toString('base64');
}

function normalize(fp) {
  const v = [...Buffer.from(fp, 'base64')];
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || 1;
  return v.map((x) => (x - mean) / sd);
}

// Hệ số tương quan Pearson: 1 = giống hệt, 0 = không liên quan
function similarity(fpA, fpB) {
  const a = normalize(fpA), b = normalize(fpB);
  return a.reduce((s, x, i) => s + x * b[i], 0) / a.length;
}

// Tính sẵn 1 lần lúc khởi động (máy chủ Render miễn phí CPU rất yếu)
const NORMALIZED = PRESETS.map((p) => normalize(p.fp));
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0) / a.length;

// -> { label, similarity, result } hoặc null nếu không khớp chắc chắn.
// fileHash: SHA-256 file gốc do app gửi kèm. Khớp mã băm -> trả ngay, không giải mã ảnh (đường nhanh).
// Tin client ở đây không sao: chỉ chọn 1 kết quả đơn mẫu công khai, và chỉ cho tài khoản dùng thử.
async function findPreset(buffer, fileHash = '') {
  if (!PRESETS.length) return null;
  const uploadedHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const exact = PRESETS.find((p) => p.sha256 && (p.sha256 === fileHash || p.sha256 === uploadedHash));
  if (exact) return { label: exact.label, similarity: 1, result: exact.result };

  const v = normalize(await fingerprint(buffer));
  const ranked = PRESETS.map((p, i) => ({ p, s: dot(v, NORMALIZED[i]) })).sort((x, y) => y.s - x.s);
  const [best, second] = ranked;
  if (best.s < MIN_SIMILARITY) return null;
  if (second && best.s - second.s < MIN_MARGIN) return null;
  return { label: best.p.label, similarity: best.s, result: best.p.result };
}

module.exports = { fingerprint, similarity, findPreset, MIN_SIMILARITY, MIN_MARGIN };
