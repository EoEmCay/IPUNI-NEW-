/** Telegram chat đã kết nối (người dùng tự bấm Start trên bot = đồng ý nhận tin). */
exports.up = async function (knex) {
  if (!(await knex.schema.hasColumn('users', 'telegram_chat_id'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('telegram_chat_id', 32).nullable().unique();
    });
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasColumn('users', 'telegram_chat_id')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('telegram_chat_id'));
  }
};
