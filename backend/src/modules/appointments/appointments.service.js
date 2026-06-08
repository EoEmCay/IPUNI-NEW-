const db = require('../../config/database');

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
  const [id] = await db('appointments').insert({ user_id: userId, ...data });
  return db('appointments').where({ id }).first();
}

async function updateAppointment(userId, id, data) {
  const appt = await db('appointments').where({ id, user_id: userId }).first();
  if (!appt) throw { status: 404, message: 'Lịch hẹn không tồn tại' };
  await db('appointments').where({ id }).update(data);
  return db('appointments').where({ id }).first();
}

async function deleteAppointment(userId, id) {
  const appt = await db('appointments').where({ id, user_id: userId }).first();
  if (!appt) throw { status: 404, message: 'Lịch hẹn không tồn tại' };
  await db('appointments').where({ id }).delete();
}

module.exports = { getAppointments, getDoctorNotes, createAppointment, updateAppointment, deleteAppointment };
