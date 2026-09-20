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

module.exports = { getFamilyLinks, upsertFamilyLink };
