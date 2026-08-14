const db = require('../../config/database');
const { sendOtp, verifyOtp, issueRegistrationTicket, issuePasswordResetTicket } = require('./otp.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

// POST /api/v1/auth/register-otp
async function register(req, res) {
  try {
    const { email, phone, target, password } = req.body;
    const actualTarget = target || email || phone;

    if (!actualTarget || !password) {
      return sendError(res, 'Vui lòng cung cấp email/số điện thoại và mật khẩu.', 400);
    }

    // Chặn TRƯỚC khi gửi OTP: nếu email/SĐT này đã có tài khoản, không tốn 1 lượt gửi
    // mail/SMS thật (và không khiến người dùng đã có tài khoản tưởng nhầm là đang đăng ký).
    const isPhoneTarget = !actualTarget.includes('@');
    const existingUser = await db('users')
      .where(isPhoneTarget ? { phone: actualTarget } : { email: actualTarget })
      .first();

    if (existingUser) {
      return sendError(
        res,
        isPhoneTarget
          ? 'Số điện thoại này đã có tài khoản. Vui lòng đăng nhập.'
          : 'Email này đã có tài khoản. Vui lòng đăng nhập.',
        409,
        'ALREADY_REGISTERED'
      );
    }

    await sendOtp(actualTarget, password);

    return sendSuccess(res, null, 'Mã OTP đã được tạo và gửi thành công.');
  } catch (err) {
    const errorMsg = err.message || 'Lỗi không xác định.';
    return sendError(res, `Không thể gửi OTP: ${errorMsg}`, err.status || 500);
  }
}

// POST /api/v1/auth/verify-otp
async function verifyOtpHandler(req, res) {
  try {
    const { email, phone, target, userOtp } = req.body;
    const actualTarget = target || email || phone;

    if (!actualTarget || !userOtp) {
      return sendError(res, 'Vui lòng cung cấp mã OTP và thông tin nhận mã.', 400);
    }

    const { target: verifiedTarget } = verifyOtp(actualTarget, userOtp.trim());
    const registrationTicket = issueRegistrationTicket(verifiedTarget);

    return sendSuccess(res, { target: verifiedTarget, registrationTicket }, 'Xác thực OTP thành công.');
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

// POST /api/v1/auth/forgot-password-otp
async function forgotPassword(req, res) {
  try {
    const { email, phone, target } = req.body;
    const actualTarget = target || email || phone;

    if (!actualTarget) {
      return sendError(res, 'Vui lòng cung cấp email/số điện thoại.', 400);
    }

    const isPhoneTarget = !actualTarget.includes('@');
    const user = await db('users')
      .where(isPhoneTarget ? { phone: actualTarget } : { email: actualTarget })
      .first();

    // Chỉ thực sự gửi OTP nếu tài khoản tồn tại, NHƯNG luôn trả về cùng một thông báo
    // dù có tài khoản hay không - tránh lộ thông tin cho kẻ dò email/SĐT nào đã đăng ký
    // DIA+ (user enumeration).
    if (user) {
      await sendOtp(actualTarget, null);
    }

    return sendSuccess(
      res,
      null,
      'Nếu email/SĐT này có tài khoản, mã xác thực đặt lại mật khẩu đã được gửi.'
    );
  } catch (err) {
    // Lỗi ở đây (hết cooldown 60s, hết lượt/ngày, lỗi gửi mail...) là lỗi hạ tầng thật,
    // không phải rò rỉ trạng thái tài khoản - vẫn cần báo rõ cho người dùng.
    return sendError(res, err.message || 'Không thể gửi mã xác thực.', err.status || 500);
  }
}

// POST /api/v1/auth/verify-reset-otp
async function verifyResetOtp(req, res) {
  try {
    const { email, phone, target, userOtp } = req.body;
    const actualTarget = target || email || phone;

    if (!actualTarget || !userOtp) {
      return sendError(res, 'Vui lòng cung cấp mã OTP và email/SĐT.', 400);
    }

    const { target: verifiedTarget } = verifyOtp(actualTarget, userOtp.trim());
    const resetTicket = issuePasswordResetTicket(verifiedTarget);

    return sendSuccess(res, { target: verifiedTarget, resetTicket }, 'Xác thực OTP thành công.');
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

module.exports = { register, verifyOtpHandler, forgotPassword, verifyResetOtp };
