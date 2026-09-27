// Thêm tiền tố "BS." cho tên bác sĩ — nhưng CHỈ khi tên/học hàm chưa có "BS".
// Ví dụ giữ nguyên: "TS BS.CKII Nguyễn Văn A", "PGS.TS.BS Trần B", "BS. Lê C"
// Thêm tiền tố: "Nguyễn Văn A" -> "BS. Nguyễn Văn A"
export function withDoctorPrefix(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  if (/bs/i.test(trimmed)) return trimmed; // đã có "BS" trong tên/học hàm
  return `BS. ${trimmed}`;
}

// So khớp tên bác sĩ bỏ qua học hàm/học vị và hoa-thường: "BS. Nguyễn Văn An" == "nguyễn văn an"
const stripTitles = (name) => String(name || '')
  .toLowerCase()
  .replace(/\b(pgs|gs|ts|ths|bs|bsck|ck|cki|ckii)\b\.?/g, ' ')
  .replace(/[.,]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function sameDoctor(a, b) {
  const x = stripTitles(a);
  return x !== '' && x === stripTitles(b);
}
