/**
 * Tầng dữ liệu lâm sàng:
 *  - Vai trò người dùng (bác sĩ / quản trị phòng khám / bệnh nhân) + clinic_id + timezone
 *  - care_links: liên kết 1 bệnh nhân <-> N người theo dõi (bác sĩ, người nhà)
 *  - medication_logs: lịch sử tuân thủ thuốc (nguồn sự thật cho "điểm tuân thủ")
 *  - medications: cột lịch nâng cao (cách ngày / theo thứ / theo cữ) — mặc định giữ hành vi CŨ
 *  - clinical_alerts: hàng đợi cảnh báo (chống gửi trùng)
 *
 * KHÔNG xoá/sửa bảng cũ — chỉ thêm mới + thêm cột nullable / có default.
 */
exports.up = async function (knex) {
  // 1) Vai trò người dùng
  if (!(await knex.schema.hasColumn('users', 'role'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('role').notNullable().defaultTo('patient'); // patient | doctor | clinic_admin
      t.string('clinic_id').nullable();
      t.string('timezone').notNullable().defaultTo('Asia/Ho_Chi_Minh');
    });
  }

  // 2) Liên kết chăm sóc
  if (!(await knex.schema.hasTable('care_links'))) {
    await knex.schema.createTable('care_links', (t) => {
      t.increments('id').primary();
      t.integer('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.integer('member_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      t.string('relation').notNullable(); // doctor | clinic_admin | family
      t.string('display_name').nullable();
      t.string('contact_email').nullable();
      t.string('contact_phone').nullable();
      t.boolean('can_view_data').notNullable().defaultTo(true);
      t.boolean('alert_on_missed_dose').notNullable().defaultTo(false);
      t.boolean('alert_on_critical_glucose').notNullable().defaultTo(false);
      t.string('status').notNullable().defaultTo('active'); // active | pending | revoked
      t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['patient_id', 'relation', 'status'], 'idx_care_patient');
      t.index(['member_id', 'status'], 'idx_care_member');
    });
  }

  // 3) Lịch sử tuân thủ thuốc
  if (!(await knex.schema.hasTable('medication_logs'))) {
    await knex.schema.createTable('medication_logs', (t) => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.integer('medication_id').notNullable().references('id').inTable('medications').onDelete('CASCADE');
      t.dateTime('scheduled_for').notNullable();
      t.string('slot_time', 5).notNullable();
      t.string('status').notNullable(); // taken | skipped | missed
      t.dateTime('taken_at').nullable();
      t.integer('delay_minutes').nullable();
      t.string('source').notNullable().defaultTo('patient'); // patient | auto_missed | caregiver
      t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['medication_id', 'scheduled_for'], 'uq_medlog_dose');
      t.index(['user_id', 'scheduled_for'], 'idx_medlog_user_time');
      t.index(['user_id', 'status'], 'idx_medlog_user_status');
    });
  }

  // 4) Lịch uống thuốc nâng cao — thêm cột, mặc định hành vi CŨ (daily)
  const addIfMissing = async (col, cb) => {
    if (!(await knex.schema.hasColumn('medications', col))) {
      await knex.schema.alterTable('medications', cb);
    }
  };
  await addIfMissing('schedule_type', (t) => t.string('schedule_type').notNullable().defaultTo('daily'));
  await addIfMissing('every_n_days', (t) => t.integer('every_n_days').nullable());
  await addIfMissing('days_of_week', (t) => t.string('days_of_week').nullable());
  await addIfMissing('anchor_date', (t) => t.string('anchor_date').nullable());
  await addIfMissing('slots', (t) => t.string('slots').nullable());
  await addIfMissing('end_date', (t) => t.string('end_date').nullable());

  // 5) Hàng đợi cảnh báo
  if (!(await knex.schema.hasTable('clinical_alerts'))) {
    await knex.schema.createTable('clinical_alerts', (t) => {
      t.increments('id').primary();
      t.integer('patient_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('type').notNullable(); // hypo | severe_hyper | missed_dose | low_adherence | inactive
      t.string('severity').notNullable(); // critical | warning
      t.string('title').notNullable();
      t.text('detail').nullable();
      t.string('dedupe_key').notNullable();
      t.boolean('notified_caregiver').notNullable().defaultTo(false);
      t.boolean('acknowledged').notNullable().defaultTo(false);
      t.integer('acknowledged_by').nullable();
      t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['patient_id', 'dedupe_key'], 'uq_alert_dedupe');
      t.index(['patient_id', 'acknowledged', 'created_at'], 'idx_alert_patient');
    });
  }

  // 6) Index phục vụ Dashboard phòng khám "bệnh nhân cần chú ý"
  await knex.schema.alterTable('metrics', (t) => {
    t.index(['measurement_category', 'measured_at'], 'idx_metric_cat_time');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('metrics', (t) => t.dropIndex([], 'idx_metric_cat_time')).catch(() => {});
  await knex.schema.dropTableIfExists('clinical_alerts');
  await knex.schema.alterTable('medications', (t) => {
    t.dropColumn('schedule_type');
    t.dropColumn('every_n_days');
    t.dropColumn('days_of_week');
    t.dropColumn('anchor_date');
    t.dropColumn('slots');
    t.dropColumn('end_date');
  });
  await knex.schema.dropTableIfExists('medication_logs');
  await knex.schema.dropTableIfExists('care_links');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('role');
    t.dropColumn('clinic_id');
    t.dropColumn('timezone');
  });
};
