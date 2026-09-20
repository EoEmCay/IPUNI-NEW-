const { z } = require('zod');

// Thêm/cập nhật 1 người thân theo dõi (relation = 'family'). Không cho phép client tự đặt
// patient_id/relation/status trực tiếp — luôn suy ra từ req.user + mặc định cứng ở service.
const upsertCareLinkSchema = z.object({
  display_name: z.string().min(1, 'Vui lòng nhập họ tên người thân').max(120),
  contact_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')).nullable(),
  contact_phone: z.string().max(20).optional().or(z.literal('')).nullable(),
  alert_on_missed_dose: z.boolean().optional(),
  alert_on_critical_glucose: z.boolean().optional(),
});

module.exports = { upsertCareLinkSchema };
