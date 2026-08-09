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
  // Vé ký số ngắn hạn do /verify-otp phát hành sau khi xác thực OTP thành công.
  // Bắt buộc để /register không còn là 1 endpoint tách rời, có thể gọi thẳng mà
  // bỏ qua toàn bộ bước xác thực số điện thoại/email.
  registrationTicket: z.string().min(10, 'Thiếu vé xác thực OTP. Vui lòng xác thực lại.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword']
}).refine(data => !!(data.email && data.email.trim()) || !!(data.phone && data.phone.trim()), {
  message: 'Cần cung cấp email hoặc số điện thoại',
  path: ['email']
});

module.exports = { loginSchema, registerSchema };
