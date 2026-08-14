const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const otpController = require('./otp.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { loginSchema, registerSchema, requestIdBodySchema, changePasswordSchema, resetPasswordSchema } = require('./auth.schema');

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);
router.get('/me', authMiddleware, controller.getMe);
router.post('/logout', authMiddleware, controller.logout);
router.post('/google-login', controller.googleLogin);
router.post('/demo-login', controller.demoLogin);
router.post('/acknowledge-session', authMiddleware, controller.acknowledgeSession);

// Xác thực đăng nhập thiết bị mới (approval flow 2 thiết bị)
// Thiết bị B (chưa có token) chỉ có requestId ngẫu nhiên (UUID, hết hạn 60s) làm "chìa khoá" - không cần auth.
router.get('/login-status', controller.loginStatus);
// Thiết bị A (đã đăng nhập) poll danh sách yêu cầu đang chờ + duyệt/từ chối.
router.get('/pending-approvals', authMiddleware, controller.pendingApprovals);
router.post('/approve-login', authMiddleware, validate(requestIdBodySchema), controller.approveLogin);
router.post('/reject-login', authMiddleware, validate(requestIdBodySchema), controller.rejectLogin);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), controller.changePassword);

// OTP email verification flow
router.post('/register-otp', otpController.register);
router.post('/verify-otp', otpController.verifyOtpHandler);

// Quên mật khẩu (không cần đăng nhập, không cần biết mật khẩu cũ)
router.post('/forgot-password-otp', otpController.forgotPassword);
router.post('/verify-reset-otp', otpController.verifyResetOtp);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);

module.exports = router;
