const { z } = require('zod');

const createAppointmentSchema = z.object({
  doctor_name: z.string().min(1, 'Tên bác sĩ không được trống'),
  department: z.string().optional(),
  scheduled_at: z.string().min(1, 'Thời gian hẹn không được trống'),
  location: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled']).optional().default('upcoming')
});

module.exports = { createAppointmentSchema };
