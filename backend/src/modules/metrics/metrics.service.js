'use strict';

const db = require('../../config/database');
const MetricsCalculator = require('./metrics.calculator');
const memoryCache = require('../../utils/memoryCache');

/**
 * Get metrics for a user with optional filtering
 */
async function getMetrics(userId, measurementType = null, measurementCategory = null, days = 7) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  let query = db('metrics')
    .where({ user_id: userId })
    .where('measured_at', '>=', fromDate.toISOString())
    .orderBy('measured_at', 'desc');

  if (measurementType) {
    query = query.where({ measurement_type: measurementType });
  }

  if (measurementCategory) {
    query = query.where({ measurement_category: measurementCategory });
  }

  return query;
}

/**
 * Get latest metric of each type for a user (In-memory cached 5m)
 */
async function getLatestByType(userId) {
  const cacheKey = `metrics:latest:${userId}`;
  const hit = memoryCache.get(cacheKey);
  if (hit) return hit;

  const types = [
    'glucose_fasting',
    'glucose_postprandial',
    'glucose_random',
    'blood_pressure',
    'hba1c',
    'weight'
  ];

  const results = await Promise.all(
    types.map(async (type) => {
      return db('metrics')
        .where({ user_id: userId, measurement_type: type })
        .orderBy('measured_at', 'desc')
        .first();
    })
  );

  memoryCache.set(cacheKey, results, 5 * 60 * 1000);
  return results;
}

async function createMetric(userId, data) {
  memoryCache.del(`metrics:latest:${userId}`);
  memoryCache.delPrefix(`care:timeline:${userId}:`);
  const [insertedRow] = await db('metrics').insert({
    user_id: userId,
    ...data
  }).returning('id');
  const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
  return db('metrics').where({ id }).first();
}

async function deleteMetric(userId, id) {
  memoryCache.del(`metrics:latest:${userId}`);
  memoryCache.delPrefix(`care:timeline:${userId}:`);
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
