const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del();

  const [hashAdmin, hashFree, hashPro, hashAdminPro] = await Promise.all([
    bcrypt.hash('123456', 10),
    bcrypt.hash('admin001', 10),
    bcrypt.hash('admin002', 10),
    bcrypt.hash('admin@123', 10),
  ]);

  await knex('users').insert([
    {
      id: 1,
      name: 'Admin Pro',
      email: 'admin@example.com',
      address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
      password_hash: hashAdminPro,
      diagnosis: 'type2_diabetes',
      plan: 'pro',
    },
    {
      id: 2,
      name: 'Khoi Test',
      email: 'khoi@example.com',
      address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
      password_hash: hashAdmin,
      diagnosis: 'type2_diabetes',
      plan: 'pro',
    },
    {
      id: 3,
      name: 'Admin 001',
      email: 'admin001',
      password_hash: hashFree,
      diagnosis: 'type2_diabetes',
      plan: 'free',
    },
    {
      id: 4,
      name: 'Admin 002',
      email: 'admin002',
      password_hash: hashPro,
      diagnosis: 'type2_diabetes',
      plan: 'pro',
    },
  ]);
};
