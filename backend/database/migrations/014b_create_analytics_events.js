/**
 * Bảng ghi nhận sự kiện truy cập & hành vi người dùng (analytics).
 * Dùng cho Admin Dashboard: lượt truy cập web, nguồn truy cập, hành vi.
 *
 * Lưu ý: các số liệu như đăng ký, demo, quét ảnh được suy ra trực tiếp từ
 * bảng `users` / `scan_usages`. Bảng này chủ yếu phục vụ PAGE VIEW + session
 * và các sự kiện tuỳ biến mà app chính gửi lên.
 */
exports.up = function (knex) {
  return knex.schema.createTable('analytics_events', (t) => {
    t.increments('id').primary();
    // page_view | demo_click | register | scan | login | custom
    t.string('event_type').notNullable().index();
    t.string('path').nullable();               // đường dẫn trang (vd /dashboard)
    t.string('session_id').nullable().index(); // định danh phiên (đếm khách duy nhất)
    t.integer('user_id').nullable();           // nếu đã đăng nhập
    t.string('referrer').nullable();           // nguồn truy cập
    t.string('user_agent', 512).nullable();
    t.text('meta').nullable();                 // JSON dữ liệu phụ
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now()).index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analytics_events');
};
