const db = require('../../config/database');
const { daysAgo } = require('../../utils/date.helper');

async function getMetrics(userId, type, days = 7) {
  const since = daysAgo(parseInt(days));
  let query = db('metrics')
    .where({ user_id: userId })
    .where('measured_at', '>=', since)
    .orderBy('measured_at', 'desc');
  if (type) query = query.where({ type });
  return query;
}

async function getLatestMetrics(userId) {
  const types = ['fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep'];
  const results = {};
  for (const type of types) {
    results[type] = await db('metrics')
      .where({ user_id: userId, type })
      .orderBy('measured_at', 'desc')
      .first();
  }
  return results;
}

async function createMetric(userId, data) {
  const [id] = await db('metrics').insert({ user_id: userId, ...data });
  return db('metrics').where({ id }).first();
}

async function deleteMetric(userId, id) {
  const metric = await db('metrics').where({ id, user_id: userId }).first();
  if (!metric) throw { status: 404, message: 'Chỉ số không tồn tại' };
  await db('metrics').where({ id }).delete();
}

module.exports = { getMetrics, getLatestMetrics, createMetric, deleteMetric };
