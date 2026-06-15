const bcrypt = require('bcryptjs');

const DEMO_ACCOUNTS = [
  {
    email: 'khoi@example.com',
    name: 'Khoi Test',
    address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
    password: 'admin',
    diagnosis: 'type2_diabetes',
    plan: 'pro',
    user_code: 'DIADEMO1',
  },
  {
    email: 'admin@example.com',
    name: 'Admin Pro',
    address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
    password: 'admin',
    diagnosis: 'type2_diabetes',
    plan: 'pro',
    user_code: 'DIADEMO2',
  },
  {
    email: 'admin002@ipuni.com',
    name: 'Demo User',
    password: 'admin002',
    diagnosis: 'type2_diabetes',
    plan: 'pro',
    user_code: 'DIADEMO3',
  },
];

exports.seed = async function(knex) {
  for (const account of DEMO_ACCOUNTS) {
    const { password, ...rest } = account;
    const exists = await knex('users').where({ email: rest.email }).first();
    if (!exists) {
      const password_hash = await bcrypt.hash(password, 10);
      await knex('users').insert({ ...rest, password_hash });
      console.log(`[SEED] Tạo tài khoản demo: ${rest.email}`);
    } else {
      console.log(`[SEED] Bỏ qua (đã tồn tại): ${rest.email}`);
    }
  }
  console.log('[SEED] Hoàn thành — dữ liệu người dùng được giữ nguyên.');
};
