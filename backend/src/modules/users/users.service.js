const db = require('../../config/database');

const PROFILE_FIELDS = [
  'id', 'user_code', 'name', 'email', 'cccd', 'phone', 'address',
  'date_of_birth', 'blood_type', 'allergies',
  'insurance_number', 'insurance_expiry',
  'diagnosis', 'plan', 'created_at',
];

function pickProfile(user) {
  return Object.fromEntries(PROFILE_FIELDS.map(k => [k, user[k] ?? null]));
}

async function getProfile(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return pickProfile(user);
}

async function updateProfile(userId, data) {
  const allowed = ['name', 'phone', 'address', 'date_of_birth', 'blood_type', 'allergies', 'insurance_number', 'insurance_expiry', 'diagnosis'];
  const update = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k) && data[k] !== undefined)
  );
  if (Object.keys(update).length === 0) throw { status: 400, message: 'Không có dữ liệu cập nhật' };
  await db('users').where({ id: userId }).update({ ...update, updated_at: new Date().toISOString() });
  const user = await db('users').where({ id: userId }).first();
  return pickProfile(user);
}

module.exports = { getProfile, updateProfile };
