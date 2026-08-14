const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// In-memory store: email/phone -> { otpCode, expiresAt, password, wrongAttempts }
const otpCache = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const MAX_WRONG_ATTEMPTS = 3;

// Dọn định kỳ các phiên OTP hết hạn nhưng chưa bao giờ được verify (người dùng bỏ dở
// đăng ký) - tránh otpCache phình vô hạn theo thời gian sống của tiến trình, đồng thời
// không giữ mật khẩu thô trong bộ nhớ lâu hơn mức cần thiết.
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of otpCache.entries()) {
    if (now > rec.expiresAt) otpCache.delete(key);
  }
}, 60 * 1000).unref();

// Giới hạn gửi OTP theo TARGET (độc lập với rate-limit theo IP ở tầng server.js):
// cooldown giữa 2 lần gửi + trần số lần/ngày, chống SMS/Email bombing nhắm vào 1 số/email cụ thể.
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 giây giữa 2 lần gửi cho cùng 1 target
const MAX_SENDS_PER_TARGET_PER_DAY = 10;
const sendCounters = new Map(); // target -> { count, dayStamp, lastSentAt }

function checkAndBumpSendLimit(target) {
  const today = new Date().toISOString().slice(0, 10);
  const rec = sendCounters.get(target) || { count: 0, dayStamp: today, lastSentAt: 0 };
  if (rec.dayStamp !== today) {
    rec.count = 0;
    rec.dayStamp = today;
  }

  if (Date.now() - rec.lastSentAt < RESEND_COOLDOWN_MS) {
    const err = new Error('Vui lòng đợi ít nhất 60 giây trước khi yêu cầu mã mới.');
    err.status = 429;
    throw err;
  }
  if (rec.count >= MAX_SENDS_PER_TARGET_PER_DAY) {
    const err = new Error('Đã đạt giới hạn gửi mã cho số điện thoại/email này hôm nay. Vui lòng thử lại vào ngày mai.');
    err.status = 429;
    throw err;
  }

  rec.count += 1;
  rec.lastSentAt = Date.now();
  sendCounters.set(target, rec);
}

const GMAIL_USER = process.env.GMAIL_USER || process.env.MAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAIL_PASS;

const transporter = (GMAIL_USER && GMAIL_PASS) ? nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
}) : null;

async function sendSmsViaEsms(phone, otpCode) {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const content = `Ma OTP xac thuc dang ky DIA+ cua ban la ${otpCode}. Ma co hieu luc trong 5 phut.`;

  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '84' + formattedPhone.slice(1);
  }

  // HTTPS (không dùng http:// thường) - ApiKey/SecretKey/OTP không được truyền trần qua mạng không mã hoá.
  const url = `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?Phone=${formattedPhone}&Content=${encodeURIComponent(content)}&ApiKey=${apiKey}&SecretKey=${secretKey}&SmsType=2`;
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
  checkAndBumpSendLimit(target);

  const otpCode = crypto.randomInt(100000, 999999).toString(); // 6 chữ số ngẫu nhiên
  const expiresAt = Date.now() + OTP_TTL_MS;
  const lower = (target || '').toLowerCase();
  const isPhone = !lower.includes('@');
  const isProduction = process.env.NODE_ENV === 'production';

  // Bypass demo CHỈ cho phép ngoài production - tránh việc "test" xuất hiện tình cờ
  // trong 1 email thật (vd nguyenvantest@gmail.com) lại vô tình nhận mã cố định trên production.
  if (!isProduction && lower.includes('test')) {
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  // 1. XỬ LÝ GỬI SMS CHO SỐ ĐIỆN THOẠI
  if (isPhone) {
    const hasEsms = process.env.ESMS_API_KEY && process.env.ESMS_SECRET_KEY;
    const hasSpeedSms = !!process.env.SPEEDSMS_ACCESS_TOKEN;

    if (hasEsms) {
      try {
        await sendSmsViaEsms(target, otpCode);
        otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });
        logger.info(`[SMS OTP] Đã gửi thành công mã qua eSMS tới SĐT ${target}`);
        return;
      } catch (err) {
        logger.error('⚠️ Lỗi gửi SMS qua eSMS: ' + err.message);
      }
    }

    if (hasSpeedSms) {
      try {
        await sendSmsViaSpeedSms(target, otpCode);
        otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });
        logger.info(`[SMS OTP] Đã gửi thành công mã qua SpeedSMS tới SĐT ${target}`);
        return;
      } catch (err) {
        logger.error('⚠️ Lỗi gửi SMS qua SpeedSMS: ' + err.message);
      }
    }

    // QUAN TRỌNG: KHÔNG được âm thầm rơi về OTP demo "123456" trên production dù là
    // do chưa cấu hình hay do provider lỗi tạm thời - đó là fail-open, vô hiệu hoá
    // toàn bộ xác thực số điện thoại mà không ai hay biết. Trên production, luôn báo
    // lỗi thật cho client thay vì âm thầm hạ cấp bảo mật.
    if (isProduction) {
      if (hasEsms || hasSpeedSms) {
        logger.error(`🚨 [OTP] Cả eSMS và SpeedSMS đều gửi thất bại cho SĐT ${target}.`);
        throw new Error('Không thể gửi mã OTP lúc này. Vui lòng thử lại sau ít phút hoặc dùng email.');
      }
      logger.error('🚨 [OTP] Production nhưng chưa cấu hình ESMS_API_KEY/SPEEDSMS_ACCESS_TOKEN.');
      throw new Error('Hệ thống xác thực SMS đang bảo trì. Vui lòng dùng email để đăng ký.');
    }

    // Chỉ tới đây khi KHÔNG phải production -> cho phép chế độ demo để dev/test cục bộ.
    logger.warn('⚠️ [DEV] Chưa cấu hình ESMS/SPEEDSMS. Dùng chế độ DEMO OTP: 123456');
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  // 2. XỬ LÝ GỬI EMAIL CHO ĐỊA CHỈ EMAIL
  if (!transporter) {
    logger.error('[EMAIL OTP] Chưa cấu hình GMAIL_USER/GMAIL_PASS (hoặc MAIL_USER/MAIL_PASS).');
    if (isProduction) {
      throw new Error('Hệ thống gửi email đang bảo trì. Vui lòng thử lại sau.');
    }
    logger.warn('⚠️ [DEV] SMTP chưa được cấu hình. Dùng chế độ DEMO OTP: 123456');
    otpCache.set(target, { otpCode: '123456', expiresAt, password, wrongAttempts: 0 });
    return;
  }

  otpCache.set(target, { otpCode, expiresAt, password, wrongAttempts: 0 });

  try {
    // LƯU Ý DELIVERABILITY: bản HTML trước đây (logo tải từ ngoài, gradient nặng, chèn cả
    // mục quảng cáo tính năng vào email OTP, KHÔNG có bản text/plain đi kèm) đã bị Gmail
    // âm thầm hủy hoàn toàn (không vào cả Spam) khi test thật trên production - trong khi
    // 1 email text/plain đơn giản từ cùng tài khoản lại gửi thành công. Email giao dịch
    // (OTP) cần tối giản, không ảnh ngoài, không nội dung marketing, và LUÔN có multipart
    // text+html để qua được các bộ lọc spam khắt khe.
    await transporter.sendMail({
      from: `"DIA+" <${GMAIL_USER}>`,
      to: target,
      subject: 'Mã xác thực OTP đăng ký DIA+',
      text: `Mã xác thực OTP đăng ký DIA+ của bạn là: ${otpCode}\n\nMã có hiệu lực trong 5 phút. Không chia sẻ mã này cho bất kỳ ai - DIA+ không bao giờ gọi điện yêu cầu cung cấp mã OTP.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\n— DIA+ (diaplus.vn)`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 24px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto;">
            <tr>
              <td style="padding-bottom: 16px;">
                <span style="font-size: 18px; font-weight: 700; color: #1B5FA6;">DIA+</span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; line-height: 1.6; color: #334155; padding-bottom: 16px;">
                Mã xác thực đăng ký tài khoản DIA+ của bạn là:
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 16px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1B5FA6;">${otpCode}</span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; line-height: 1.6; padding-bottom: 8px;">
                Mã có hiệu lực trong 5 phút. Không chia sẻ mã này cho bất kỳ ai — DIA+ không bao giờ gọi điện yêu cầu cung cấp mã OTP.
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #94A3B8; padding-top: 16px; border-top: 1px solid #E2E8F0; margin-top: 16px;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email. — <a href="https://diaplus.vn" style="color: #1B5FA6;">diaplus.vn</a>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    logger.info(`[EMAIL OTP] Đã gửi thành công mã tới Email ${target}`);
  } catch (err) {
    logger.error('Lỗi khi gửi OTP qua Email: ' + err.message);
    otpCache.delete(target);
    if (isProduction) {
      throw new Error('Không thể gửi email OTP lúc này. Vui lòng thử lại sau ít phút.');
    }
    logger.warn('⚠️ [DEV] Fallback sang chế độ DEMO do lỗi mạng: OTP là 123456');
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

// ============================================================================
// VÉ XÁC THỰC ĐĂNG KÝ (Registration Ticket):
// /auth/register vốn dĩ là 1 request HOÀN TOÀN TÁCH RỜI với /verify-otp - không có
// gì ràng buộc việc tạo tài khoản phải đi sau một lượt xác thực OTP thành công. Vé
// này là bằng chứng ký số (JWT ngắn hạn, 5 phút) rằng "target X vừa xác thực OTP
// thành công", bắt buộc phải kèm theo khi gọi /auth/register - đóng lỗ hổng cho
// phép tạo tài khoản bằng SĐT/email người khác mà không cần nhận mã gì cả.
// ============================================================================
const REG_TICKET_SECRET = process.env.REG_TICKET_SECRET || process.env.JWT_SECRET;

function issueRegistrationTicket(target) {
  return jwt.sign({ target, purpose: 'otp_verified_registration' }, REG_TICKET_SECRET, { expiresIn: '5m' });
}

function verifyRegistrationTicket(ticket, target) {
  if (!ticket) {
    const err = new Error('Thiếu vé xác thực OTP. Vui lòng xác thực lại số điện thoại/email.');
    err.status = 400;
    throw err;
  }
  try {
    const payload = jwt.verify(ticket, REG_TICKET_SECRET);
    if (payload.purpose !== 'otp_verified_registration' || payload.target !== target) {
      throw new Error('mismatch');
    }
    return true;
  } catch {
    const err = new Error('Phiên xác thực OTP không hợp lệ hoặc đã hết hạn. Vui lòng xác thực lại.');
    err.status = 400;
    throw err;
  }
}

module.exports = { sendOtp, verifyOtp, issueRegistrationTicket, verifyRegistrationTicket };
