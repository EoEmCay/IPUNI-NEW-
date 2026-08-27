const db = require('../../config/database');

const JSON_ARRAY_FIELDS = ['times', 'days_of_week', 'slots'];
const WRITABLE_FIELDS = [
  'name', 'dosage', 'frequency', 'times', 'instructions', 'doctor_name',
  'prescribed_at', 'is_active', 'next_appointment_date',
  'schedule_type', 'every_n_days', 'days_of_week', 'anchor_date', 'end_date', 'slots',
];

function parseMed(med) {
  if (!med) return null;
  const out = { ...med };
  for (const f of JSON_ARRAY_FIELDS) {
    if (f in out) {
      try {
        const p = JSON.parse(out[f] || (f === 'times' ? '[]' : 'null'));
        out[f] = Array.isArray(p) ? p : (f === 'times' ? [] : null);
      } catch {
        out[f] = f === 'times' ? [] : null;
      }
    }
  }
  return out;
}

/** Chỉ nhận các field cho phép ghi; serialize field JSON. Chống mass-assignment. */
function pickWritable(data) {
  const payload = {};
  for (const k of WRITABLE_FIELDS) {
    if (data[k] === undefined) continue;
    payload[k] = JSON_ARRAY_FIELDS.includes(k) && data[k] !== null
      ? JSON.stringify(data[k])
      : data[k];
  }
  return payload;
}

async function getMedications(userId) {
  const meds = await db('medications')
    .where({ user_id: userId, is_active: 1 })
    .orderBy('created_at', 'desc');
  return meds.map(parseMed);
}

async function getTodayMedications(userId) {
  const meds = await db('medications').where({ user_id: userId, is_active: 1 });
  return meds.map(parseMed);
}

async function createMedication(userId, data) {
  const payload = { ...pickWritable(data), user_id: userId };
  if (payload.times === undefined) payload.times = JSON.stringify([]);
  const [insertedRow] = await db('medications').insert(payload).returning('id');
  const id = typeof insertedRow === 'object' && insertedRow !== null ? insertedRow.id : insertedRow;
  return parseMed(await db('medications').where({ id }).first());
}

async function updateMedication(userId, id, data) {
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };

  const payload = pickWritable(data);
  if (Object.keys(payload).length === 0) throw { status: 400, message: 'Không có dữ liệu cập nhật' };

  await db('medications').where({ id, user_id: userId }).update(payload);
  return parseMed(await db('medications').where({ id, user_id: userId }).first());
}

async function deleteMedication(userId, id) {
  const med = await db('medications').where({ id, user_id: userId }).first();
  if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };
  await db('medications').where({ id, user_id: userId }).delete();
}

module.exports = {
  getMedications,
  getTodayMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  parseMed,
};
