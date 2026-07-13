// Thêm tiền tố "BS." cho tên bác sĩ — nhưng CHỈ khi tên/học hàm chưa có "BS".
// Ví dụ giữ nguyên: "TS BS.CKII Nguyễn Văn A", "PGS.TS.BS Trần B", "BS. Lê C"
// Thêm tiền tố: "Nguyễn Văn A" -> "BS. Nguyễn Văn A"
export function withDoctorPrefix(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  if (/bs/i.test(trimmed)) return trimmed; // đã có "BS" trong tên/học hàm
  return `BS. ${trimmed}`;
}
