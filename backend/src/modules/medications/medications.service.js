const db = require('../../config/database');

function parseMed(med) {
  if (!med) return null;
  return { ...med, times: JSON.parse(med.times || '[]') };
}

async function getMedications(userId) {
  const meds = await db('medications').where({ user_id: userId, is_active: 1 }).orderBy('created_at', 'desc');
  return meds.map(parseMed);
}

async function getTodayMedications(userId) {
  const meds = await db('medications').where({ user_id: userId, is_active: 1 });
  return meds.map(parseMed);
}

async function createMedication(userId, data) {
  const payload = { ...data, user_id: userId, times: JSON.stringify(data.times) };
  const [id] = await db('medications').insert(payload);
  return parseMed(await db('medications').where({ id }).first());
}

async function updateMedication(userId, id, data) {
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };
  const payload = { ...data };
  if (data.times) payload.times = JSON.stringify(data.times);
  await db('medications').where({ id }).update(payload);
  return parseMed(await db('medications').where({ id }).first());
}

async function deleteMedication(userId, id) {
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };
  await db('medications').where({ id }).delete();
}

module.exports = { getMedications, getTodayMedications, createMedication, updateMedication, deleteMedication };
