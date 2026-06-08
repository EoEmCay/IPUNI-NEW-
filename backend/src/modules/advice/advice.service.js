const db = require('../../config/database');

async function getAdvice(category) {
  let q = db('advice').where({ is_active: 1 });
  if (category && category !== 'all') q = q.where({ category });
  return q.orderBy('category').orderBy('sort_order');
}

async function getAdviceById(id) {
  const item = await db('advice').where({ id }).first();
  if (!item) throw { status: 404, message: 'Lời khuyên không tồn tại' };
  return item;
}

module.exports = { getAdvice, getAdviceById };
