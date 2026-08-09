const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory store: email -> { otpCode, expiresAt, password, wrongAttempts }
const otpCache = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const MAX_WRONG_ATTEMPTS = 3;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || process.env.MAIL_USER || 'khoile3006.official@gmail.com',
    pass: process.env.GMAIL_PASS || process.env.MAIL_PASS || 'pykj aizq klwb lvdd', 
  },
  connectionTimeout: 5000, // Tối đa 5 giây để kết nối
  greetingTimeout: 5000,
  socketTimeout: 5000
});

async function sendOtp(target, password) {
  const otpCode = crypto.randomInt(100000, 999999).toString(); // 6 chữ số
  const expiresAt = Date.now() + OTP_TTL_MS;
  const lower = (target || '').toLowerCase();

  // Nếu là số điện thoại hoặc có từ 'test', dùng OTP mặc định 123456
  if (!lower.includes('@') || lower.includes('test')) {
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });

  try {
    const senderEmail = process.env.GMAIL_USER || process.env.MAIL_USER || 'khoile3006.official@gmail.com';
    
    // Check if credentials are set (not dummy or empty)
    if (!senderEmail || senderEmail === 'your-email@gmail.com') {
      console.warn('⚠️ SMTP chưa được cấu hình. Chuyển sang chế độ DEMO: OTP là 123456');
      otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
      return;
    }

    // Gửi email OTP
    await transporter.sendMail({
      from: `"DIA+" <${senderEmail}>`,
      to: target,
      subject: 'Mã xác thực OTP đăng ký DIA+',
      html: `
        <p>Mã OTP của bạn là:</p>
        <h2 style="letter-spacing:4px">${otpCode}</h2>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
      `,
    });
  } catch (err) {
    console.error('Lỗi khi gửi OTP qua Email:', err);
    console.warn('⚠️ Fallback sang chế độ DEMO do lỗi mạng: OTP là 123456');
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
  }
}

function verifyOtp(target, userOtp) {
  const record = otpCache.get(target);

  // Không tìm thấy phiên đăng ký
  if (!record) {
    const err = new Error('Không tìm thấy yêu cầu đăng ký. Vui lòng thử lại.');
    err.status = 400;
    throw err;
  }

  // Khoá sau MAX_WRONG_ATTEMPTS lần sai
  if (record.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
    otpCache.delete(target);
    const err = new Error('Quá số lần thử. Vui lòng đăng ký lại.');
    err.status = 400;
    throw err;
  }

  // Hết hạn
  if (Date.now() > record.expiresAt) {
    otpCache.delete(target);
    const err = new Error('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
    err.status = 400;
    throw err;
  }

  // OTP sai — tăng đếm, cập nhật cache
  if (userOtp !== record.otpCode) {
    otpCache.set(target, { ...record, wrongAttempts: record.wrongAttempts + 1 });
    const remaining = MAX_WRONG_ATTEMPTS - (record.wrongAttempts + 1);
    const err = new Error(`Mã OTP không đúng. Còn ${remaining} lần thử.`);
    err.status = 400;
    throw err;
  }

  // Thành công — lấy dữ liệu, dọn cache
  const { password } = record;
  otpCache.delete(target);
  return { target, password };
}

module.exports = { sendOtp, verifyOtp };
