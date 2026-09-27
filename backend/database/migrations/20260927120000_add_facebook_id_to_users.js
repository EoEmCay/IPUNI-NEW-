/** Đăng nhập Facebook: nhận diện người dùng bằng ID Facebook (có người dùng FB bằng SĐT, không có email). */
exports.up = async function (knex) {
  if (!(await knex.schema.hasColumn('users', 'facebook_id'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('facebook_id', 64).nullable().unique();
    });
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasColumn('users', 'facebook_id')) {
    await knex.schema.alterTable('users', (t) => t.dropColumn('facebook_id'));
  }
};
