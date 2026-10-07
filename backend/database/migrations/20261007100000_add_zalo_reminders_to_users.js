/** Người dùng đồng ý nhận nhắc uống thuốc qua Zalo (ZNS) - mặc định TẮT, phải tự bật. */
exports.up = async function (knex) {
  if (!(await knex.schema.hasColumn('users', 'zalo_reminders'))) {
    await knex.schema.alterTable('users', (t) => {
      t.boolean('zalo_reminders').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasColumn('users', 'zalo_reminders')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('zalo_reminders'));
  }
};
