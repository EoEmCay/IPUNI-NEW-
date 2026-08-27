'use strict';
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { sendSuccess } = require('../../utils/response.helper');
const db = require('../../config/database');
const metricsService = require('../metrics/metrics.service');
const medicationsService = require('../medications/medications.service');

/**
 * GET /api/v1/dashboard/summary
 * Gộp 3 request Dashboard (latest metrics + thuốc hôm nay + lịch hẹn sắp tới) thành 1.
 * 3 truy vấn chạy song song.
 */
router.get('/summary', authMiddleware, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [latestMetrics, todayMedications, nextAppointment] = await Promise.all([
      metricsService.getLatestByType(uid),
      medicationsService.getTodayMedications(uid),
      db('appointments')
        .where({ user_id: uid, status: 'upcoming' })
        .orderBy('scheduled_at', 'asc')
        .first(),
    ]);
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    sendSuccess(res, { latestMetrics, todayMedications, nextAppointment: nextAppointment || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
