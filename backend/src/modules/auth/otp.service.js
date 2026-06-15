const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory store: email -> { otpCode, expiresAt, password, wrongAttempts }
const otpCache = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const MAX_WRONG_ATTEMPTS = 3;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // App Password Gmail
  },
});

async function sendOtp(email, password) {
  const otpCode = crypto.randomInt(100000, 999999).toString(); // 6 chữ số
  const expiresAt = Date.now() + OTP_TTL_MS;

  // Ghi đè nếu email đã tồn tại (gửi lại OTP)
  otpCache.set(email, { otpCode, expiresAt, password, wrongAttempts: 0 });

  await transporter.sendMail({
    from: `"DIA+" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Mã xác thực OTP đăng ký DIA+',
    html: `
      <p>Mã OTP của bạn là:</p>
      <h2 style="letter-spacing:4px">${otpCode}</h2>
      <p>Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
    `,
  });
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
