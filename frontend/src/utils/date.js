// Định dạng ngày kiểu Việt Nam DD/MM/YYYY. Dùng new Date() thay vì cắt chuỗi ISO thủ công
// để tương thích với cả "YYYY-MM-DD" và các định dạng datetime khác trả về từ backend.
export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
