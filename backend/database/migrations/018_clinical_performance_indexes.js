/**
 * Index cho các truy vấn nặng (Dashboard phòng khám, lịch sử, hạn mức quét).
 * Tra cứu bệnh nhân theo CCCD/SĐT/email/user_code đã có unique index từ migration 006/010.
 * Lịch sử đo 30 ngày đã có index từ migration 012.
 */
exports.up = async function (knex) {
  const safeIndex = async (table, cols, name) => {
    try {
      await knex.schema.alterTable(table, (t) => t.index(cols, name));
    } catch (e) {
      // index đã tồn tại -> bỏ qua
    }
  };

  await safeIndex('medications', ['user_id', 'is_active', 'created_at'], 'idx_med_user_active');
  await safeIndex('appointments', ['user_id', 'status', 'scheduled_at'], 'idx_appt_user_status');
  await safeIndex('appointments', ['user_id', 'scheduled_at'], 'idx_appt_user_sched');
  await safeIndex('scan_usages', ['user_id', 'scanned_at'], 'idx_scan_user_time');
  await safeIndex('advice', ['is_active', 'category', 'sort_order'], 'idx_advice_active_cat');
  await safeIndex('analytics_events', ['event_type', 'created_at'], 'idx_evt_type_time');
  await safeIndex('metrics', ['status', 'measured_at'], 'idx_metric_status_time');
};

exports.down = async function (knex) {
  const drop = async (table, name) => {
    try {
      await knex.schema.alterTable(table, (t) => t.dropIndex([], name));
    } catch (e) {}
  };
  await drop('medications', 'idx_med_user_active');
  await drop('appointments', 'idx_appt_user_status');
  await drop('appointments', 'idx_appt_user_sched');
  await drop('scan_usages', 'idx_scan_user_time');
  await drop('advice', 'idx_advice_active_cat');
  await drop('analytics_events', 'idx_evt_type_time');
  await drop('metrics', 'idx_metric_status_time');
};
