const { z } = require('zod');

const scheduleFields = {
  schedule_type: z.enum(['daily', 'every_n_days', 'days_of_week', 'as_needed']).optional(),
  every_n_days: z.number().int().min(1).max(60).optional().nullable(),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  anchor_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ngày không hợp lệ').optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ngày không hợp lệ').optional().nullable(),
  slots: z.array(z.enum(['morning', 'noon', 'afternoon', 'evening', 'bedtime'])).optional().nullable(),
};

const createMedicationSchema = z.object({
  name: z.string().min(1, 'Tên thuốc không được trống'),
  dosage: z.string().min(1, 'Liều lượng không được trống'),
  frequency: z.string().min(1, 'Tần suất không được trống'),
  times: z.array(z.string()).min(1, 'Phải có ít nhất 1 thời điểm uống'),
  instructions: z.string().optional(),
  doctor_name: z.string().optional(),
  prescribed_at: z.string().optional(),
  is_active: z.number().int().min(0).max(1).optional().default(1),
  ...scheduleFields,
});

// Cập nhật: mọi field optional (partial), KHÔNG cho phép user_id / id
const updateMedicationSchema = createMedicationSchema.partial();

const logDoseSchema = z.object({
  status: z.enum(['taken', 'skipped', 'missed']).optional().default('taken'),
  scheduledFor: z.string().optional(),
  takenAt: z.string().optional(),
});

module.exports = { createMedicationSchema, updateMedicationSchema, logDoseSchema };
