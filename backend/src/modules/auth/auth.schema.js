const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập thông tin đăng nhập'),
  password: z.string().min(4, 'Mật khẩu ít nhất 4 ký tự')
});

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(11, 'Số điện thoại không hợp lệ').regex(/^\d+$/, 'Số điện thoại chỉ gồm chữ số').optional(),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  name: z.string().min(2).max(60).optional(),
  diagnosis: z.enum(['type2_diabetes', 'type1_diabetes', 'prediabetes']).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword']
});

module.exports = { loginSchema, registerSchema };
