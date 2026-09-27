'use strict';
const db = require('../../config/database');

/** Lấy danh sách người thân (relation='family') đang theo dõi bệnh nhân hiện tại. */
async function getFamilyLinks(patientId) {
  return db('care_links')
    .where({ patient_id: patientId, relation: 'family' })
    .orderBy('created_at', 'desc');
}

/**
 * Thêm hoặc cập nhật người thân theo dõi (relation='family').
 * Giao diện hiện tại (MedicationHistoryModal) chỉ quản lý 1 liên hệ người nhà cho mỗi bệnh
 * nhân, nên upsert theo (patient_id, relation='family') — bấm "Lưu" nhiều lần chỉ cập nhật
 * cùng 1 bản ghi thay vì tạo trùng lặp.
 */
async function upsertFamilyLink(patientId, data) {
  const existing = await db('care_links')
    .where({ patient_id: patientId, relation: 'family' })
    .first();

  const payload = {
    display_name: data.display_name,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    alert_on_missed_dose: data.alert_on_missed_dose !== undefined ? !!data.alert_on_missed_dose : true,
    alert_on_critical_glucose: data.alert_on_critical_glucose !== undefined ? !!data.alert_on_critical_glucose : true,
    can_view_data: true,
    status: 'active',
  };

  if (existing) {
    await db('care_links').where({ id: existing.id }).update(payload);
    return db('care_links').where({ id: existing.id }).first();
  }

  const [insertedRow] = await db('care_links')
    .insert({ patient_id: patientId, relation: 'family', ...payload })
    .returning('id');
  const id = typeof insertedRow === 'object' && insertedRow !== null ? insertedRow.id : insertedRow;
  return db('care_links').where({ id }).first();
}

// ── Gia đình liên kết bằng mã tài khoản ──────────────────────────────────────────────
// Mỗi tài khoản có 1 mã riêng (users.user_code). Người này nhập mã người kia -> 2 người thành
// 1 gia đình: tạo liên kết HAI CHIỀU, mỗi người nhận cảnh báo bỏ cữ / quên uống của người kia.
// Dùng relation riêng 'family_account' để không đụng liên hệ người nhà (tên/email/SĐT) ở trên.
const FAMILY = 'family_account';
const FAMILY_ALERT_TYPES = ['missed_dose', 'skipped_dose'];
const ALERT_WINDOW_HOURS = 48;

const memberView = (u) => ({ id: u.id, name: u.name || 'Người nhà', user_code: u.user_code, phone: u.phone || null });

async function joinFamilyByCode(userId, code) {
  const normalized = String(code || '').replace(/\s+/g, '').toUpperCase();
  const target = await db('users').whereRaw('UPPER(user_code) = ?', [normalized]).first();
  if (!target) throw { status: 404, message: 'Không tìm thấy tài khoản với mã này. Vui lòng kiểm tra lại mã.' };
  if (target.id === userId) throw { status: 400, message: 'Đây là mã của chính bạn. Hãy nhập mã của người nhà.' };

  for (const [patient, member] of [[userId, target.id], [target.id, userId]]) {
    const existing = await db('care_links').where({ patient_id: patient, member_id: member, relation: FAMILY }).first();
    if (existing) {
      if (existing.status !== 'active') await db('care_links').where({ id: existing.id }).update({ status: 'active' });
      continue;
    }
    await db('care_links').insert({
      patient_id: patient, member_id: member, relation: FAMILY,
      can_view_data: true, alert_on_missed_dose: true, alert_on_critical_glucose: true, status: 'active',
    });
  }
  return memberView(target);
}

async function getFamilyMembers(userId) {
  const rows = await db('care_links as l')
    .join('users as u', 'u.id', 'l.member_id')
    .where({ 'l.patient_id': userId, 'l.relation': FAMILY, 'l.status': 'active' })
    .select('u.id', 'u.name', 'u.user_code', 'u.phone');
  return rows.map(memberView);
}

async function leaveFamily(userId, memberId) {
  await db('care_links')
    .where({ relation: FAMILY })
    .andWhere((q) => q.where({ patient_id: userId, member_id: memberId }).orWhere({ patient_id: memberId, member_id: userId }))
    .delete();
}

// Cảnh báo bỏ cữ / quên uống của những người trong gia đình mà người này CHƯA bấm "Đã biết"
async function getFamilyAlerts(userId) {
  const since = new Date(Date.now() - ALERT_WINDOW_HOURS * 3600000).toISOString().replace('T', ' ').slice(0, 19);
  return db('clinical_alerts as a')
    .join('care_links as l', 'l.patient_id', 'a.patient_id')
    .join('users as u', 'u.id', 'a.patient_id')
    .leftJoin('alert_acks as k', function () { this.on('k.alert_id', 'a.id').andOnVal('k.member_id', '=', userId); })
    .where({ 'l.member_id': userId, 'l.relation': FAMILY, 'l.status': 'active' })
    .whereIn('a.type', FAMILY_ALERT_TYPES)
    .andWhere('a.created_at', '>=', since)
    .whereNull('k.id')
    .orderBy('a.created_at', 'desc')
    .select('a.id', 'a.type', 'a.title', 'a.detail', 'a.created_at', 'u.name as patient_name', 'u.phone as patient_phone');
}

async function ackFamilyAlert(userId, alertId) {
  // Chỉ xác nhận được cảnh báo của người trong gia đình mình
  const alert = await db('clinical_alerts as a')
    .join('care_links as l', 'l.patient_id', 'a.patient_id')
    .where({ 'a.id': alertId, 'l.member_id': userId, 'l.relation': FAMILY, 'l.status': 'active' })
    .first('a.id');
  if (!alert) throw { status: 404, message: 'Không tìm thấy cảnh báo' };
  await db('alert_acks').insert({ alert_id: alert.id, member_id: userId }).onConflict(['alert_id', 'member_id']).ignore();
}

module.exports = {
  getFamilyLinks, upsertFamilyLink,
  joinFamilyByCode, getFamilyMembers, leaveFamily, getFamilyAlerts, ackFamilyAlert,
};
