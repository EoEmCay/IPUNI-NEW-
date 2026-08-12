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
    await transporter.sendMail({
      from: `"DIA+ Health System" <${GMAIL_USER}>`,
      to: target,
      subject: 'Mã xác thực OTP đăng ký DIA+',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã xác thực OTP DIA+</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                  <!-- Header Gradient & Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1B5FA6 0%, #0F3C6E 100%); padding: 36px 24px 30px; text-align: center;">
                      <!-- Logo Image -->
                      <img src="https://diaplus.vn/logo.jpg" alt="DIA+ Logo" width="76" height="76" style="border-radius: 20px; border: 3px solid rgba(255,255,255,0.9); box-shadow: 0 6px 16px rgba(0,0,0,0.2); display: block; margin: 0 auto 14px; object-fit: cover;" />
                      
                      <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 1px;">
                        DIA<span style="color: #60A5FA;">+</span> HEALTH SYSTEM
                      </h1>
                      <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 6px 0 0; font-weight: 500;">
                        Giải Pháp Toàn Diện Quản Lý Bệnh Lý, Dinh Dưỡng & Vận Động
                      </p>
                    </td>
                  </tr>

                  <!-- Main Body -->
                  <tr>
                    <td style="padding: 32px 28px; text-align: center;">
                      <span style="background: #EFF6FF; color: #1B5FA6; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 12px;">
                        Xác Thực Đăng Ký Tài Khoản
                      </span>

                      <h2 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 12px;">Mã Xác Thực OTP Của Bạn</h2>
                      
                      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                        Cảm ơn bạn đã lựa chọn <strong>DIA+ (IAPLUS.VN)</strong> - Trợ lý y tế thông minh đồng hành cùng sức khỏe đái tháo đường. Dưới đây là mã OTP xác thực của bạn:
                      </p>

                      <!-- OTP Box -->
                      <div style="background: linear-gradient(180deg, #F0F7FF 0%, #E0F2FE 100%); border: 2px dashed #3B82F6; border-radius: 16px; padding: 22px 16px; margin: 0 auto 24px; width: 85%;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1B5FA6; display: block; margin-left: 12px;">${otpCode}</span>
                        <p style="color: #DC2626; font-size: 13px; font-weight: 600; margin: 10px 0 0;">
                          ⏱️ Mã có hiệu lực trong <strong>5 phút</strong>
                        </p>
                      </div>

                      <!-- Security Warning Box -->
                      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; text-align: left; margin-bottom: 28px;">
                        <p style="color: #92400E; font-size: 13px; margin: 0; line-height: 1.5;">
                          🛡️ <strong>Bảo mật tuyệt đối:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Đội ngũ DIA+ không bao giờ gọi điện yêu cầu cung cấp mã OTP của bạn.
                        </p>
                      </div>

                      <!-- Features Highlight Bar -->
                      <div style="border-top: 1px solid #E2E8F0; padding-top: 24px; margin-top: 12px; text-align: left;">
                        <p style="color: #64748B; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 14px; text-align: center;">
                          Tính Năng Nổi Bật Tại DIA+
                        </p>
                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" style="padding: 6px 4px; font-size: 12px; color: #334155;">🎙️ <strong>Giọng nói AI:</strong> Nhắc thuốc thông minh</td>
                            <td width="50%" style="padding: 6px 4px; font-size: 12px; color: #334155;">📸 <strong>Quét AI:</strong> Đơn thuốc & Xét nghiệm</td>
                          </tr>
                          <tr>
                            <td width="50%" style="padding: 6px 4px; font-size: 12px; color: #334155;">📊 <strong>Chỉ số:</strong> HbA1c & Đường huyết</td>
                            <td width="50%" style="padding: 6px 4px; font-size: 12px; color: #334155;">👨‍⚕️ <strong>Bác sĩ:</strong> Đặt lịch chuyên khoa</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                      <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 4px;">
                        HỆ THỐNG QUẢN LÝ Y TẾ DIA+ (IAPLUS.VN)
                      </p>
                      <p style="color: #64748B; font-size: 12px; margin: 0 0 10px;">
                        Đại diện dự án: <strong>Lê Minh Khôi</strong> (Founder) · Hotline: <strong>(+84) 986897439</strong>
                      </p>
                      <p style="color: #94A3B8; font-size: 11px; margin: 0 0 8px;">
                        Website chính thức: <a href="https://diaplus.vn" style="color: #1B5FA6; text-decoration: none; font-weight: 600;">diaplus.vn</a> · Email: khoile3006.official@gmail.com
                      </p>
                      <p style="color: #CBD5E1; font-size: 11px; margin: 0;">
                        © 2026 DIA+ Health System. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
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
