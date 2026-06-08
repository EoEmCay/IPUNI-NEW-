const express = require('express');
const router = express.Router();
const controller = require('./metrics.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createMetricSchema } = require('./metrics.schema');

router.use(authMiddleware);
router.get('/latest', controller.getLatestMetrics);
router.get('/', controller.getMetrics);
router.post('/', validate(createMetricSchema), controller.createMetric);
router.delete('/:id', controller.deleteMetric);

module.exports = router;
