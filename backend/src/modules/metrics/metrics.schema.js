const { z } = require('zod');

const createMetricSchema = z.object({
  type: z.enum(['fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep'], {
    errorMap: () => ({ message: 'Loại đường huyết không hợp lệ' })
  }),
  value: z.number().min(0.1, 'Giá trị phải lớn hơn 0').max(50, 'Giá trị không hợp lệ (tối đa 50 mmol/L)'),
  measured_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
  note: z.string().optional()
});

module.exports = { createMetricSchema };
