const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const otpController = require('./otp.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('./auth.schema');

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);
router.get('/me', authMiddleware, controller.getMe);
router.post('/logout', authMiddleware, controller.logout);
router.post('/google-mock', controller.googleMock);
router.post('/demo-login', controller.demoLogin);

// OTP email verification flow
router.post('/register-otp', otpController.register);
router.post('/verify-otp', otpController.verifyOtpHandler);

module.exports = router;
