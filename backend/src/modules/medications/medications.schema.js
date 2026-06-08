const { z } = require('zod');

const createMedicationSchema = z.object({
  name: z.string().min(1, 'Tên thuốc không được trống'),
  dosage: z.string().min(1, 'Liều lượng không được trống'),
  frequency: z.string().min(1, 'Tần suất không được trống'),
  times: z.array(z.string()).min(1, 'Phải có ít nhất 1 thời điểm uống'),
  instructions: z.string().optional(),
  doctor_name: z.string().optional(),
  prescribed_at: z.string().optional(),
  is_active: z.number().optional().default(1)
});

module.exports = { createMedicationSchema };
