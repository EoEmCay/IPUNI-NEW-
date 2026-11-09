/**
 * Index bổ sung cho các truy vấn "nóng" mà các migration 012/014/017/018 CHƯA phủ.
 *
 * Đã có sẵn (KHÔNG tạo lại):
 *   metrics(user_id, measured_at)                          - 012
 *   metrics(user_id, measurement_type, measured_at)        - 014
 *   medication_logs(user_id, scheduled_for)                - 017  idx_medlog_user_time
 *   medication_logs(user_id, status)                       - 017  idx_medlog_user_status
 *   appointments(user_id, status, scheduled_at)            - 018
 *
 * Thêm mới (mỗi cái ứng với 1 truy vấn thật trong src/):
 *   1) medication_logs(user_id, status, scheduled_for)
 *        adherence.service.js: WHERE user_id AND status='taken'|'missed' AND scheduled_for >= ...
 *        -> lọc + range trên cùng 1 index, không phải đọc rồi lọc status.
 *   2) medication_logs(user_id, created_at)
 *        care.service.js (14/30 ngày): WHERE user_id AND created_at >= ...
 *        -> trước đây không có index nào phủ created_at.
 *   3) metrics(user_id, measurement_category, measured_at)
 *        alert.service.js, metrics.service.js: WHERE user_id AND measurement_category
 *        AND measured_at >= ... ORDER BY measured_at DESC -> hết bước sort.
 *
 * Dùng CREATE INDEX IF NOT EXISTS (SQLite + PostgreSQL đều hỗ trợ) thay vì try/catch:
 * trên Postgres, một câu lệnh lỗi làm hỏng cả transaction của migration.
 */
const INDEXES = [
  ['idx_medlog_user_status_time', 'medication_logs', 'user_id, status, scheduled_for'],
  ['idx_medlog_user_created', 'medication_logs', 'user_id, created_at'],
  ['idx_metric_user_cat_time', 'metrics', 'user_id, measurement_category, measured_at'],
];

exports.up = async function (knex) {
  for (const [name, table, cols] of INDEXES) {
    if (!(await knex.schema.hasTable(table))) continue;
    await knex.raw(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${cols})`);
  }
};

exports.down = async function (knex) {
  for (const [name] of INDEXES) {
    await knex.raw(`DROP INDEX IF EXISTS ${name}`);
  }
};
