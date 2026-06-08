const metricsService = require('./metrics.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getMetrics(req, res, next) {
  try {
    const { type, days } = req.query;
    const data = await metricsService.getMetrics(req.user.id, type, days);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

async function getLatestMetrics(req, res, next) {
  try {
    const data = await metricsService.getLatestMetrics(req.user.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

async function createMetric(req, res, next) {
  try {
    const data = await metricsService.createMetric(req.user.id, req.validatedBody);
    sendSuccess(res, data, 'Đã lưu chỉ số', 201);
  } catch (err) { next(err); }
}

async function deleteMetric(req, res, next) {
  try {
    await metricsService.deleteMetric(req.user.id, req.params.id);
    sendSuccess(res, null, 'Đã xóa chỉ số');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { getMetrics, getLatestMetrics, createMetric, deleteMetric };
