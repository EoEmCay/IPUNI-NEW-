/**
 * Sự kiện cốt lõi của vòng chăm sóc - dùng để ĐO được sản phẩm có hoạt động thật không:
 *   reminder_sent          nhắc uống thuốc đã gửi (channel: telegram | zns)
 *   dose_confirmed         liều được xác nhận đã uống (channel: app | telegram | caregiver)
 *   caregiver_alert_sent   báo người nhà đã gửi (channel: telegram | zns | sms | email)
 *   caregiver_alert_acked  người nhà bấm "Đã biết" (là mốc "đã đọc" duy nhất đo được chắc chắn)
 *
 * KHÔNG lưu tên thuốc, nội dung tin nhắn hay số điện thoại ở đây (dữ liệu sức khỏe/PDPL):
 * chỉ lưu id và kênh. Không dùng khóa ngoại để xóa tài khoản không bị vướng và ghi sự kiện
 * không bao giờ làm hỏng luồng nhắc thuốc.
 */
exports.up = async function (knex) {
  if (await knex.schema.hasTable('care_events')) return;
  await knex.schema.createTable('care_events', (t) => {
    t.increments('id').primary();
    t.string('event_type', 40).notNullable();
    t.integer('user_id').nullable();        // bệnh nhân
    t.integer('actor_id').nullable();       // người thực hiện / người nhận (người nhà, hộ lý)
    t.integer('medication_id').nullable();
    t.integer('alert_id').nullable();
    t.string('scheduled_for', 40).nullable(); // ISO của cữ thuốc liên quan
    t.string('channel', 20).nullable();
    t.string('status', 12).notNullable().defaultTo('ok'); // ok | failed
    t.text('meta').nullable();              // JSON nhỏ: reason, delay_minutes, alert_type...
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['event_type', 'created_at'], 'idx_care_events_type_time');
    t.index(['user_id', 'created_at'], 'idx_care_events_user_time');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('care_events');
};
