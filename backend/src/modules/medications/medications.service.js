'use strict';
const db = require('../../config/database');
const memoryCache = require('../../utils/memoryCache');

const WRITABLE_FIELDS = [
  'name', 'dosage', 'frequency', 'times', 'slots', 'days_of_week',
  'instructions', 'start_date', 'end_date', 'is_active', 'prescription_group',
  'schedule_type', 'every_n_days', 'target_conditions', 'drug_class',
  'side_effects', 'storage_guide', 'patient_note', 'image_url',
];

const JSON_ARRAY_FIELDS = ['times', 'slots', 'days_of_week'];

function parseMed(row) {
  if (!row) return null;
  const out = { ...row };
  for (const k of JSON_ARRAY_FIELDS) {
    if (out[k] === null || out[k] === undefined) continue;
    if (Array.isArray(out[k])) continue;
    try {
      out[k] = JSON.parse(out[k]);
    } catch {
      out[k] = [];
    }
  }
  return out;
}

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

/* ───────────── Cache danh sách thuốc (in-memory, TTL 10 phút) ─────────────
 * Dữ liệu thuốc ảnh hưởng trực tiếp tới liều uống của người bệnh nên cache KHÔNG ĐƯỢC giữ bản cũ:
 *  1) Xoá cache SAU khi ghi DB xong (finally), không phải trước — nếu xoá trước, một request GET
 *     chen vào giữa sẽ nạp lại dữ liệu CŨ và giữ nó tới hết TTL.
 *  2) Số phiên bản theo từng người dùng: GET bắt đầu trước lúc ghi nhưng xong sau lúc ghi sẽ thấy
 *     phiên bản đã đổi và KHÔNG ghi kết quả cũ vào cache.
 *  3) Khoá chính xác (không dùng tiền tố: tiền tố `meds:all:1` cũng trùng user 10, 11, 100...).
 *  4) Trả về bản sao để nơi gọi sửa object không làm bẩn cache.
 * Chỉ đúng khi chạy 1 instance (hiện tại render.yaml chỉ có 1 web service). Nếu scale ngang
 * nhiều instance, xoá cache ở instance này không lan sang instance khác -> phải chuyển sang Redis.
 */
const MED_CACHE_TTL_MS = 10 * 60 * 1000;
const medVersions = new Map(); // userId -> số lần dữ liệu thuốc đã thay đổi

const medsAllKey = (userId) => `meds:all:${userId}`;
const medsTodayKey = (userId) => `meds:today:${userId}`;
const medVersion = (userId) => medVersions.get(String(userId)) || 0;

function invalidateUserMedCache(userId) {
  medVersions.set(String(userId), medVersion(userId) + 1);
  memoryCache.del(medsAllKey(userId));
  memoryCache.del(medsTodayKey(userId));
  memoryCache.delPrefix(`care:timeline:${userId}:`);
}

async function cachedMeds(userId, key, load) {
  const hit = memoryCache.get(key);
  if (hit) return structuredClone(hit);

  const versionBefore = medVersion(userId);
  const result = (await load()).map(parseMed);
  // Có ghi dữ liệu thuốc trong lúc đang đọc DB -> kết quả này có thể đã cũ, không cache.
  if (medVersion(userId) === versionBefore) memoryCache.set(key, result, MED_CACHE_TTL_MS);
  return structuredClone(result);
}

function getMedications(userId) {
  return cachedMeds(userId, medsAllKey(userId), () =>
    db('medications').where({ user_id: userId, is_active: 1 }).orderBy('created_at', 'desc'));
}

function getTodayMedications(userId) {
  return cachedMeds(userId, medsTodayKey(userId), () =>
    db('medications').where({ user_id: userId, is_active: 1 }));
}

async function createMedication(userId, data) {
  try {
    const payload = { ...pickWritable(data), user_id: userId };
    if (payload.times === undefined) payload.times = JSON.stringify([]);
    const [insertedRow] = await db('medications').insert(payload).returning('id');
    const id = typeof insertedRow === 'object' && insertedRow !== null ? insertedRow.id : insertedRow;
    return parseMed(await db('medications').where({ id }).first());
  } finally {
    invalidateUserMedCache(userId);
  }
}

async function updateMedication(userId, id, data) {
  try {
    const med = await db('medications').where({ id, user_id: userId }).first();
    if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };

    const payload = pickWritable(data);
    if (Object.keys(payload).length === 0) throw { status: 400, message: 'Không có dữ liệu cập nhật' };

    await db('medications').where({ id, user_id: userId }).update(payload);
    return parseMed(await db('medications').where({ id, user_id: userId }).first());
  } finally {
    invalidateUserMedCache(userId);
  }
}

async function deleteMedication(userId, id) {
  try {
    const med = await db('medications').where({ id, user_id: userId }).first();
    if (!med) throw { status: 404, message: 'Thuốc không tồn tại' };
    await db('medications').where({ id, user_id: userId }).delete();
  } finally {
    invalidateUserMedCache(userId);
  }
}

module.exports = {
  getMedications,
  getTodayMedications,
  createMedication,
  updateMedication,
  deleteMedication,
};
