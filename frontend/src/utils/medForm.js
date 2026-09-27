// Dạng thuốc suy ra từ tên/liều/lời dặn - dữ liệu thuốc chưa có trường "dạng bào chế".
// Thuốc tiêm trong điều trị tiểu đường gần như chỉ gồm insulin và nhóm GLP-1 (bút tiêm).
// ponytail: đoán theo tên; muốn chính xác tuyệt đối thì thêm cột dosage_form do AI quét trả về.
export const INSULIN_PATTERN = /insulin|lantus|novomix|novorapid|humulin|humalog|levemir|mixtard|toujeo|tresiba|apidra/i;
const INJECTION_PATTERN = new RegExp(
  `${INSULIN_PATTERN.source}|ozempic|victoza|trulicity|saxenda|semaglutide|liraglutide|dulaglutide|tiêm|\\b(UI|IU)\\b|đơn vị`,
  'i'
);

export function isInjection(med) {
  return INJECTION_PATTERN.test([med?.name, med?.dosage, med?.instructions].filter(Boolean).join(' '));
}
