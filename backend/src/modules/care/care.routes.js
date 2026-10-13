'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./care.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

// 1. Dòng thời gian Live kiểu Grab trong ngày (Live Care Timeline)
router.get('/timeline', controller.getLiveTimeline);

// 2. Ghi nhận cữ uống thuốc từ người chăm sóc / gia đình
router.post('/log-dose', controller.logCaregiverDose);

// 3. Bản tin tuần cho con cháu & phân tích quy luật bỏ cữ (AI Insights)
router.get('/weekly-summary', controller.getWeeklySummary);

// 4. Báo cáo 1 trang tóm tắt cho Bác sĩ trước buổi tái khám
router.get('/doctor-report', controller.getDoctorReport);

module.exports = router;
