const db = require('../../config/database');

async function getProfile(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return { id: user.id, name: user.name, email: user.email, diagnosis: user.diagnosis };
}

module.exports = { getProfile };
