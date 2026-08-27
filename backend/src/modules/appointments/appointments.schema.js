const { z } = require('zod');

const createAppointmentSchema = z.object({
  doctor_name: z.string().min(1, 'Tên bác sĩ không được để trống'),
  department: z.string().optional(),
  scheduled_at: z.string().min(1, 'Thời gian hẹn không được để trống'),
  location: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled']).optional().default('upcoming')
});

const updateAppointmentSchema = createAppointmentSchema.partial();

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema
};
