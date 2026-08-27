const metricsService = require('./metrics.service');
const MetricsCalculator = require('./metrics.calculator');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const { publish } = require('../../realtime/eventBus');
const { evaluateAndQueueAlerts } = require('../clinic/alert.service');

async function getMetrics(req, res, next) {
  try {
    const { measurement_type, measurement_category, days = 7 } = req.query;
    const data = await metricsService.getMetrics(
      req.user.id,
      measurement_type,
      measurement_category,
      parseInt(days)
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getLatestMetrics(req, res, next) {
  try {
    const data = await metricsService.getLatestByType(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const { measurement_type, measurement_category, days = 90 } = req.query;

    const readings = await metricsService.getMetrics(
      req.user.id,
      measurement_type,
      measurement_category,
      parseInt(days)
    );

    const stats = MetricsCalculator.getStatistics(readings);

    // If glucose readings, calculate estimated HbA1c
    let estimatedHbA1c = null;
    if (!measurement_type || measurement_type.includes('glucose')) {
      const glucoseReadings = readings.filter(r => r.measurement_category === 'glucose');
      if (glucoseReadings.length > 0) {
        const stats_calc = MetricsCalculator.getStatistics(glucoseReadings);
        estimatedHbA1c = MetricsCalculator.estimateHbA1c(stats_calc.average);
      }
    }

    sendSuccess(res, {
      statistics: stats,
      estimatedHbA1c,
      period: `${days} days`,
      readingCount: readings.length
    });
  } catch (err) {
    next(err);
  }
}

async function createMetric(req, res, next) {
  try {
    const { measurement_type, value, value_diastolic, measured_at, note } = req.validatedBody;

    // Determine category & unit based on type
    let measurement_category = 'glucose';
    let unit = 'mmol/L';
    if (measurement_type === 'blood_pressure') { measurement_category = 'blood_pressure'; unit = 'mmHg'; } else if (measurement_type === 'hba1c') {
      measurement_category = 'hba1c';
      unit = '%';
    } else if (measurement_type === 'c_peptide') {
      measurement_category = 'c_peptide';
      unit = 'ng/mL';
    }

    // Calculate status - truyền chẩn đoán của bệnh nhân (req.user.diagnosis) để dùng mục
    // tiêu điều trị CÁ NHÂN HOÁ (ADA Standards of Care) thay vì ngưỡng chẩn đoán quần thể,
    // vốn dành cho sàng lọc người CHƯA biết mình có tiểu đường hay không. Xem
    // metrics.calculator.js#calculateStatus.
    const status = MetricsCalculator.calculateStatus(measurement_type, value, value_diastolic, req.user.diagnosis);

    // Note: User feedback requested NOT to load 90 days data on every save to optimize performance.
    // HbA1c estimation will only be done in the /statistics endpoint.

    const metric = await metricsService.createMetric(req.user.id, {
      measurement_type,
      measurement_category,
      value,
      value_diastolic,
      unit,
      measured_at,
      status,
      estimated_hba1c: null,
      note
    });

    // Đồng bộ realtime cho phòng khám + đánh giá cờ đỏ lâm sàng (không chặn response)
    publish('patient.metric_added', {
      patientId: req.user.id,
      metric: {
        id: metric.id,
        type: metric.measurement_type,
        value: metric.value,
        status: metric.status,
        at: metric.measured_at,
      },
    });
    evaluateAndQueueAlerts(req.user.id).catch(() => {});

    sendSuccess(res, metric, 'Metric recorded successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function deleteMetric(req, res, next) {
  try {
    await metricsService.deleteMetric(req.user.id, req.params.id);
    sendSuccess(res, null, 'Metric deleted');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = {
  getMetrics,
  getLatestMetrics,
  getStatistics,
  createMetric,
  deleteMetric
};
