const authService = require('./auth.service');
const { verifyRegistrationTicket, verifyPasswordResetTicket } = require('./otp.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function login(req, res, next) {
  try {
    const { identifier, password } = req.validatedBody;
    const result = await authService.login(identifier, password);
    const message = result.status === 'pending'
      ? 'Đang chờ xác nhận từ thiết bị đang đăng nhập'
      : 'Đăng nhập thành công';
    sendSuccess(res, result, message);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { email, phone, password, name, diagnosis, registrationTicket } = req.validatedBody;
    // Bắt buộc phải có vé OTP hợp lệ khớp đúng target (email hoặc phone) vừa đăng ký -
    // đóng lỗ hổng cho phép tạo tài khoản bỏ qua hoàn toàn bước xác thực OTP.
    const target = (email && email.trim()) || (phone && phone.trim());
    verifyRegistrationTicket(registrationTicket, target);

    const result = await authService.register(email, phone, password, { name, diagnosis });
    sendSuccess(res, result, 'Đăng ký thành công', 201);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function logout(req, res) {
  await authService.logout(req.user?.id);
  sendSuccess(res, null, 'Đăng xuất thành công');
}

async function googleLogin(req, res, next) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) throw { status: 400, message: 'Vui lòng cung cấp accessToken' };
    const result = await authService.googleLogin(accessToken);
    const message = result.status === 'pending'
      ? 'Đang chờ xác nhận từ thiết bị đang đăng nhập'
      : 'Đăng nhập Google thành công';
    sendSuccess(res, result, message);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function demoLogin(req, res, next) {
  try {
    const result = await authService.demoLogin();
    sendSuccess(res, result, 'Đăng nhập demo thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function acknowledgeSession(req, res) {
  try {
    const { token, user } = await authService.acknowledgeSession(req.user);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function loginStatus(req, res, next) {
  try {
    const requestId = req.query.requestId;
    if (!requestId) throw { status: 400, message: 'Thiếu requestId' };
    const result = await authService.getLoginStatus(requestId);
    sendSuccess(res, result);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function pendingApprovals(req, res, next) {
  try {
    const result = await authService.getPendingApprovals(req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function approveLogin(req, res, next) {
  try {
    const { requestId } = req.validatedBody;
    const result = await authService.approveLogin(requestId, req.user.id);
    sendSuccess(res, result, 'Đã cho phép đăng nhập');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function rejectLogin(req, res, next) {
  try {
    const { requestId } = req.validatedBody;
    const result = await authService.rejectLogin(requestId, req.user.id);
    sendSuccess(res, result, 'Đã từ chối đăng nhập');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, result, 'Đổi mật khẩu thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, phone, newPassword, resetTicket } = req.validatedBody;
    const target = (email && email.trim()) || (phone && phone.trim());
    // Vé phải đúng target và đúng mục đích 'password_reset' - không thể tái sử dụng vé
    // xác thực OTP đăng ký, hoặc vé xác thực cho email/SĐT khác.
    verifyPasswordResetTicket(resetTicket, target);

    const result = await authService.resetPassword(target, newPassword);
    sendSuccess(res, result, 'Đặt lại mật khẩu thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = {
  login, register, getMe, logout, googleLogin, demoLogin, acknowledgeSession,
  loginStatus, pendingApprovals, approveLogin, rejectLogin, changePassword, resetPassword,
};
