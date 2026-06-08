const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập thông tin đăng nhập'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự')
});

const registerSchema = z.object({
  cccd: z.string().length(12, 'CCCD phải đúng 12 chữ số').regex(/^\d{12}$/, 'CCCD chỉ gồm chữ số'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(11, 'Số điện thoại không hợp lệ').regex(/^\d+$/, 'Số điện thoại chỉ gồm chữ số'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword']
});

module.exports = { loginSchema, registerSchema };
