const db = require('../../config/database');
const { daysAgo } = require('../../utils/date.helper');
const MetricsCalculator = require('./metrics.calculator');

async function getMetrics(userId, measurementType, measurementCategory, days = 7) {
  const since = daysAgo(days);

  let query = db('metrics')
    .where({ user_id: userId })
    .where('measured_at', '>=', since)
    .orderBy('measured_at', 'desc');

  if (measurementType) {
    query = query.where({ measurement_type: measurementType });
  }

  if (measurementCategory) {
    query = query.where({ measurement_category: measurementCategory });
  }

  return query;
}

async function getLatestByType(userId) {
  const types = ['glucose_fasting', 'glucose_postmeal', 'hba1c', 'c_peptide', 'blood_pressure'];
  const results = {};

  // Fetch all in ONE query instead of 5 separate queries (N+1 optimization)
  const allMetrics = await db('metrics')
    .where('user_id', userId)
    .whereIn('measurement_type', types)
    .orderBy('measured_at', 'desc');

  const seen = {};
  allMetrics.forEach(metric => {
    if (!seen[metric.measurement_type]) {
      results[metric.measurement_type] = metric;
      seen[metric.measurement_type] = true;
    }
  });

  types.forEach(type => {
    if (!results[type]) results[type] = null;
  });

  return results;
}

async function createMetric(userId, data) {
  const [insertedRow] = await db('metrics').insert({
    user_id: userId,
    ...data
  }).returning('id');
  const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
  return db('metrics').where({ id }).first();
}

async function deleteMetric(userId, id) {
  const metric = await db('metrics').where({ id, user_id: userId }).first();
  if (!metric) {
    throw { status: 404, message: 'Metric not found' };
  }
  await db('metrics').where({ id }).delete();
}

/**
 * Get statistics for a period
 */
async function getStatisticsForPeriod(userId, measurementType, days = 90) {
  const readings = await getMetrics(userId, measurementType, null, days);
  return MetricsCalculator.getStatistics(readings);
}

module.exports = {
  getMetrics,
  getLatestByType,
  createMetric,
  deleteMetric,
  getStatisticsForPeriod
};
