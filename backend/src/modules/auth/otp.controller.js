const { sendOtp, verifyOtp, issueRegistrationTicket } = require('./otp.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

// POST /api/v1/auth/register-otp
async function register(req, res) {
  try {
    const { email, phone, target, password } = req.body;
    const actualTarget = target || email || phone;

    if (!actualTarget || !password) {
      return sendError(res, 'Vui lòng cung cấp email/số điện thoại và mật khẩu.', 400);
    }

    await sendOtp(actualTarget, password);

    return sendSuccess(res, null, 'Mã OTP đã được tạo và gửi thành công.');
  } catch (err) {
    const errorMsg = err.message || 'Lỗi không xác định.';
    return sendError(res, `Không thể gửi OTP: ${errorMsg}`, 500);
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

module.exports = { register, verifyOtpHandler };
