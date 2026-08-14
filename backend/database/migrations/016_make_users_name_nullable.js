// users.name được tạo notNullable() ở 001_create_users.js, nhưng cả UI đăng ký (ô "Họ và
// tên (tuỳ chọn)") lẫn CLAUDE.md đều coi trường này là tùy chọn - user tự cập nhật sau. Kết
// quả: đăng ký mà bỏ trống Họ tên sẽ crash 500 (SQLITE_CONSTRAINT / Postgres NOT NULL
// violation) ngay ở bước insert. Sửa lại cho khớp đúng thiết kế: name được phép NULL.
exports.up = function (knex) {
  return knex.schema.alterTable('users', function (t) {
    t.string('name').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (t) {
    t.string('name').notNullable().alter();
  });
};
