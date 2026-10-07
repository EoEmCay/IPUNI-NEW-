const db = require('../../config/database');
const zns = require('../../services/zns.service');
const tg = require('../../services/telegram.service');

const PROFILE_FIELDS = [
  'id', 'user_code', 'name', 'email', 'cccd', 'phone', 'address',
  'date_of_birth', 'blood_type', 'allergies',
  'insurance_number', 'insurance_expiry',
  'diagnosis', 'plan', 'created_at', 'zalo_reminders',
];

function pickProfile(user) {
  return {
    ...Object.fromEntries(PROFILE_FIELDS.map(k => [k, user[k] ?? null])),
    zalo_reminders: Boolean(user.zalo_reminders),
    // Giao diện chỉ hiện công tắc "Nhắc qua Zalo" khi server đã cấu hình ZNS.
    zalo_reminders_available: zns.isConfigured('doseReminder'),
    telegram_linked: Boolean(user.telegram_chat_id),
    telegram_available: tg.isConfigured(),
  };
}

async function getProfile(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return pickProfile(user);
}

async function updateProfile(userId, data) {
  const allowed = ['name', 'phone', 'address', 'date_of_birth', 'blood_type', 'allergies', 'insurance_number', 'insurance_expiry', 'diagnosis', 'zalo_reminders'];
  const update = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k) && data[k] !== undefined)
  );
  if (Object.keys(update).length === 0) throw { status: 400, message: 'Không có dữ liệu cập nhật' };
  if ('zalo_reminders' in update) {
    update.zalo_reminders = update.zalo_reminders === true;
    const current = await db('users').where({ id: userId }).first();
    if (update.zalo_reminders && !(update.phone || (current && current.phone))) {
      throw { status: 400, message: 'Vui lòng cập nhật số điện thoại (có dùng Zalo) trước khi bật nhắc qua Zalo' };
    }
  }
  await db('users').where({ id: userId }).update({ ...update, updated_at: new Date().toISOString() });
  const user = await db('users').where({ id: userId }).first();
  return pickProfile(user);
}

async function getTelegramLink(userId) {
  if (!tg.isConfigured()) throw { status: 503, message: 'Tính năng Telegram chưa được bật trên máy chủ' };
  return { url: tg.linkUrl(userId) };
}

async function unlinkTelegram(userId) {
  await db('users').where({ id: userId }).update({ telegram_chat_id: null });
  return getProfile(userId);
}

module.exports = { getProfile, updateProfile, getTelegramLink, unlinkTelegram };
