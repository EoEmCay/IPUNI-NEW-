const { sendOtp, verifyOtp } = require('./otp.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

// POST /api/register
async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email và mật khẩu là bắt buộc.', 400);
    }

    await sendOtp(email, password);

    return sendSuccess(res, null, 'Mã OTP đã được gửi đến email của bạn.');
  } catch (err) {
    // Nodemailer thất bại hoặc lỗi bất ngờ
    return sendError(res, 'Không thể gửi email. Vui lòng thử lại sau.', 500);
  }
}

// POST /api/verify-otp
async function verifyOtpHandler(req, res) {
  try {
    const { email, userOtp } = req.body;

    if (!email || !userOtp) {
      return sendError(res, 'Email và mã OTP là bắt buộc.', 400);
    }

    const { email: verifiedEmail, password } = verifyOtp(email, userOtp.trim());

    // TODO: thay console.log bằng lời gọi DB thực tế (bcrypt hash + INSERT users)
    console.log(`[DB] Tạo user mới: email=${verifiedEmail}`);

    return sendSuccess(res, { email: verifiedEmail }, 'Đăng ký thành công.');
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

module.exports = { register, verifyOtpHandler };
