const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('./auth.schema');

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);
router.get('/me', authMiddleware, controller.getMe);
router.post('/logout', authMiddleware, controller.logout);

module.exports = router;
