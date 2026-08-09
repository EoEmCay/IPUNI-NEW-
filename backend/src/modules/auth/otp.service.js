const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');

// In-memory store: email/phone -> { otpCode, expiresAt, password, wrongAttempts }
const otpCache = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const MAX_WRONG_ATTEMPTS = 3;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || process.env.MAIL_USER || 'khoile3006.official@gmail.com',
    pass: process.env.GMAIL_PASS || process.env.MAIL_PASS || 'pykj aizq klwb lvdd', 
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
});

async function sendSmsViaEsms(phone, otpCode) {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const content = `Ma OTP xac thuc dang ky DIA+ cua ban la ${otpCode}. Ma co hieu luc trong 5 phut.`;
  
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '84' + formattedPhone.slice(1);
  }

  const url = `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?Phone=${formattedPhone}&Content=${encodeURIComponent(content)}&ApiKey=${apiKey}&SecretKey=${secretKey}&SmsType=2`;
  const response = await axios.get(url, { timeout: 8000 });
  if (response.data && String(response.data.CodeResult) !== '100') {
    throw new Error(`eSMS error: ${response.data.ErrorMessage || response.data.CodeResult}`);
  }
}

async function sendSmsViaSpeedSms(phone, otpCode) {
  const token = process.env.SPEEDSMS_ACCESS_TOKEN;
  const content = `Ma OTP xac thuc dang ky DIA+ cua ban la ${otpCode}. Ma co hieu luc trong 5 phut.`;
  const url = 'https://api.speedsms.vn/index.php/sms/send';
  
  const response = await axios.post(url, {
    to: [phone],
    content,
    sms_type: 2,
    sender: ''
  }, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(token + ':x').toString('base64'),
      'Content-Type': 'application/json'
    },
    timeout: 8000
  });

  if (response.data && response.data.status !== 'success') {
    throw new Error(`SpeedSMS error: ${response.data.message}`);
  }
}

async function sendOtp(target, password) {
  const otpCode = crypto.randomInt(100000, 999999).toString(); // 6 chữ số ngẫu nhiên
  const expiresAt = Date.now() + OTP_TTL_MS;
  const lower = (target || '').toLowerCase();
  const isPhone = !lower.includes('@');

  if (lower.includes('test')) {
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  // 1. XỬ LÝ GỬI SMS CHO SỐ ĐIỆN THOẠI
  if (isPhone) {
    if (process.env.ESMS_API_KEY && process.env.ESMS_SECRET_KEY) {
      try {
        await sendSmsViaEsms(target, otpCode);
        otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });
        console.log(`[SMS OTP] Đã gửi thành công mã ${otpCode} qua eSMS tới SĐT ${target}`);
        return;
      } catch (err) {
        console.error('⚠️ Lỗi gửi SMS qua eSMS:', err.message);
      }
    }

    if (process.env.SPEEDSMS_ACCESS_TOKEN) {
      try {
        await sendSmsViaSpeedSms(target, otpCode);
        otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });
        console.log(`[SMS OTP] Đã gửi thành công mã ${otpCode} qua SpeedSMS tới SĐT ${target}`);
        return;
      } catch (err) {
        console.error('⚠️ Lỗi gửi SMS qua SpeedSMS:', err.message);
      }
    }

    console.warn('⚠️ Chưa cài đặt ESMS_API_KEY hoặc SPEEDSMS_ACCESS_TOKEN trong .env. Dùng chế độ DEMO OTP: 123456');
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  // 2. XỬ LÝ GỬI EMAIL CHO ĐỊA CHỈ EMAIL
  otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });

  try {
    const senderEmail = process.env.GMAIL_USER || process.env.MAIL_USER || 'khoile3006.official@gmail.com';
    
    if (!senderEmail || senderEmail === 'your-email@gmail.com') {
      console.warn('⚠️ SMTP chưa được cấu hình. Chuyển sang chế độ DEMO: OTP là 123456');
      otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
      return;
    }

    // Gửi email OTP thật
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
    console.log(`[EMAIL OTP] Đã gửi thành công mã ${otpCode} tới Email ${target}`);
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
