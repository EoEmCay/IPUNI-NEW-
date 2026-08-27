const bcrypt = require('bcryptjs');

/**
 * Tài khoản BÁC SĨ + liên kết chăm sóc mẫu để test Dashboard phòng khám (/clinic).
 * KHÔNG xoá dữ liệu có sẵn.
 *
 * Đăng nhập: bs.nam@diaplus.vn / doctor123  (role = doctor, clinic_id = CLINIC01)
 */
exports.seed = async function (knex) {
  const doctorEmail = 'bs.nam@diaplus.vn';
  let doctor = await knex('users').where({ email: doctorEmail }).first();

  if (!doctor) {
    const password_hash = await bcrypt.hash('doctor123', 10);
    const [id] = await knex('users').insert({
      email: doctorEmail,
      name: 'BS. Trần Văn Nam',
      password_hash,
      role: 'doctor',
      clinic_id: 'CLINIC01',
      user_code: 'DIADOC01',
      diagnosis: 'type2_diabetes',
      plan: 'pro',
    });
    doctor = await knex('users').where({ id }).first();
    console.log('[SEED] Tạo tài khoản bác sĩ: ' + doctorEmail + ' / doctor123');
  } else {
    // đảm bảo role đúng nếu tài khoản đã có từ trước
    await knex('users').where({ id: doctor.id }).update({ role: 'doctor', clinic_id: 'CLINIC01' });
  }

  // Gán các bệnh nhân demo hiện có vào cùng phòng khám + tạo care_link
  const demoPatients = await knex('users')
    .whereIn('email', ['khoi@example.com', 'admin@example.com', 'admin002@ipuni.com'])
    .select('id', 'email');

  for (const p of demoPatients) {
    await knex('users').where({ id: p.id }).update({ clinic_id: 'CLINIC01', role: 'patient' });
    const link = await knex('care_links')
      .where({ patient_id: p.id, member_id: doctor.id, relation: 'doctor' })
      .first();
    if (!link) {
      await knex('care_links').insert({
        patient_id: p.id,
        member_id: doctor.id,
        relation: 'doctor',
        display_name: 'BS. Trần Văn Nam',
        can_view_data: true,
        status: 'active',
      });
    }
  }

  console.log('[SEED] Liên kết ' + demoPatients.length + ' bệnh nhân demo với phòng khám CLINIC01.');
};
