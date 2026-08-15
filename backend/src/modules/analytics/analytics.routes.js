const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { adminAuth } = require('../../middlewares/adminAuth.middleware');

// Công khai — app chính gửi sự kiện truy cập (page view, demo click...)
router.post('/track', controller.track);

// Bảo vệ bằng admin key
router.get('/overview', adminAuth, controller.overview);
router.get('/users', adminAuth, controller.getUsers);
router.get('/charts', adminAuth, controller.charts);
router.get('/recent', adminAuth, controller.recent);
router.get('/health', adminAuth, controller.health);
router.post('/export-sheets', adminAuth, controller.exportSheets);
router.post('/test-mail', adminAuth, controller.testMail);

module.exports = router;
