const express = require('express');
const router = express.Router();
const controller = require('./tts.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Chỉ dùng trong app, cho người đã đăng nhập - không cần public ra ngoài.
router.get('/speak', authMiddleware, controller.speak);

module.exports = router;
