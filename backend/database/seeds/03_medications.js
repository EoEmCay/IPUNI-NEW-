exports.seed = async function(knex) {
  // Seed chứa tài khoản/mật khẩu mẫu (vd admin/admin, plan pro): TUYỆT ĐỐI không chạy trên production.
  if (process.env.NODE_ENV === 'production') throw new Error('Không được chạy seed ở production.');

  await knex('medications').del();
};

