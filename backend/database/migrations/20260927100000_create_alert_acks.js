/**
 * Người nhà bấm "Đã biết" cho 1 cảnh báo (bỏ cữ / quên uống) của người thân trong gia đình.
 * Mỗi người nhà xác nhận riêng: cảnh báo còn nhắc lại cho tới khi CHÍNH người đó bấm.
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('alert_acks'))) {
    await knex.schema.createTable('alert_acks', (t) => {
      t.increments('id').primary();
      t.integer('alert_id').notNullable().references('id').inTable('clinical_alerts').onDelete('CASCADE');
      t.integer('member_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.dateTime('acked_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['alert_id', 'member_id'], 'uq_alert_ack');
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('alert_acks');
};
