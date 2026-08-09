const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập thông tin đăng nhập'),
  password: z.string().min(4, 'Mật khẩu ít nhất 4 ký tự')
});

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')).refine(val => !val || (val.length >= 9 && val.length <= 11 && /^\d+$/.test(val)), {
    message: 'Số điện thoại không hợp lệ (9-11 chữ số)'
  }),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  name: z.string().min(2).max(60).optional().or(z.literal('')),
  diagnosis: z.enum(['type2_diabetes', 'type1_diabetes', 'prediabetes']).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword']
});

module.exports = { loginSchema, registerSchema };
