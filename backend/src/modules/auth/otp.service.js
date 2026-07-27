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
});

async function sendOtp(email, password) {
  const otpCode = crypto.randomInt(100000, 999999).toString(); // 6 chữ số
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Nếu email có chứa chữ "test", bỏ qua gửi email thực tế và cố định mã OTP
  if (email.toLowerCase().includes('test')) {
    const testOtp = '123456';
    otpCache.set(email, { otpCode: testOtp, expiresAt, password, wrongAttempts: 0 });
    return;
  }

  otpCache.set(email, { otpCode, expiresAt, password, wrongAttempts: 0 });

  try {
    const senderEmail = process.env.GMAIL_USER || process.env.MAIL_USER || 'khoile3006.official@gmail.com';
    
    // Check if credentials are set (not dummy or empty)
    if (!senderEmail || senderEmail === 'your-email@gmail.com') {
      console.warn('⚠️ SMTP chưa được cấu hình. Chuyển sang chế độ DEMO: OTP là 123456');
      otpCache.set(email, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
      return;
    }

    // Gửi email OTP
    await transporter.sendMail({
      from: `"DIA+" <${senderEmail}>`,
      to: email,
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
    otpCache.set(email, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
  }
}

function verifyOtp(email, userOtp) {
  const record = otpCache.get(email);

  // Không tìm thấy phiên đăng ký
  if (!record) {
    const err = new Error('Không tìm thấy yêu cầu đăng ký. Vui lòng thử lại.');
    err.status = 400;
    throw err;
  }

  // Khoá sau MAX_WRONG_ATTEMPTS lần sai
  if (record.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
    otpCache.delete(email);
    const err = new Error('Quá số lần thử. Vui lòng đăng ký lại.');
    err.status = 400;
    throw err;
  }

  // Hết hạn
  if (Date.now() > record.expiresAt) {
    otpCache.delete(email);
    const err = new Error('Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
    err.status = 400;
    throw err;
  }

  // OTP sai — tăng đếm, cập nhật cache
  if (userOtp !== record.otpCode) {
    otpCache.set(email, { ...record, wrongAttempts: record.wrongAttempts + 1 });
    const remaining = MAX_WRONG_ATTEMPTS - (record.wrongAttempts + 1);
    const err = new Error(`Mã OTP không đúng. Còn ${remaining} lần thử.`);
    err.status = 400;
    throw err;
  }

  // Thành công — lấy dữ liệu, dọn cache
  const { password } = record;
  otpCache.delete(email);
  return { email, password };
}

module.exports = { sendOtp, verifyOtp };
