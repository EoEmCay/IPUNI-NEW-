const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del();
  const password_hash = await bcrypt.hash('123456', 10);
  await knex('users').insert([
    {
      id: 1,
      name: 'Khoi Le',
      email: 'khoi@example.com',
      password_hash,
      diagnosis: 'type2_diabetes'
    }
  ]);
};
