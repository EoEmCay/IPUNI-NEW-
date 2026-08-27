const db = require('../../config/database');

const WRITABLE_FIELDS = ['doctor_name', 'department', 'scheduled_at', 'location', 'note', 'status'];

function pickWritable(data) {
  const payload = {};
  for (const k of WRITABLE_FIELDS) if (data[k] !== undefined) payload[k] = data[k];
  return payload;
}

async function getAppointments(userId, status) {
  let q = db('appointments').where({ user_id: userId });
  if (status) q = q.where({ status });
  return q.orderBy('scheduled_at', 'asc');
}

async function getDoctorNotes(userId) {
  return db('appointments')
    .where({ user_id: userId })
    .whereNotNull('note')
    .where('note', '!=', '')
    .orderBy('scheduled_at', 'desc');
}

async function createAppointment(userId, data) {
  const [insertedRow] = await db('appointments').insert({ user_id: userId, ...pickWritable(data) }).returning('id');
  const id = typeof insertedRow === 'object' && insertedRow !== null ? insertedRow.id : insertedRow;
  return db('appointments').where({ id }).first();
}

async function updateAppointment(userId, id, data) {
  const appt = await db('appointments').where({ id, user_id: userId }).first();
  if (!appt) throw { status: 404, message: 'Lịch hẹn không tồn tại' };
  const payload = pickWritable(data);
  if (Object.keys(payload).length === 0) throw { status: 400, message: 'Không có dữ liệu cập nhật' };
  await db('appointments').where({ id, user_id: userId }).update(payload);
  return db('appointments').where({ id, user_id: userId }).first();
}

async function deleteAppointment(userId, id) {
  const appt = await db('appointments').where({ id, user_id: userId }).first();
  if (!appt) throw { status: 404, message: 'Lịch hẹn không tồn tại' };
  await db('appointments').where({ id, user_id: userId }).delete();
}

module.exports = { getAppointments, getDoctorNotes, createAppointment, updateAppointment, deleteAppointment };
