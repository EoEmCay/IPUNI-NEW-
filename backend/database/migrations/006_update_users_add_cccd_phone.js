exports.up = async function(knex) {
  await knex.schema.createTable('users_new', (t) => {
    t.increments('id').primary();
    t.string('name');
    t.string('email').unique();
    t.string('cccd', 12).unique();
    t.string('phone').unique();
    t.string('password_hash').notNullable();
    t.string('diagnosis').defaultTo('type2_diabetes');
    t.datetime('created_at').defaultTo(knex.fn.now());
    t.datetime('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    INSERT INTO users_new (id, name, email, cccd, phone, password_hash, diagnosis, created_at, updated_at)
    SELECT id, name, email, NULL, NULL, password_hash, diagnosis, created_at, updated_at FROM users
  `);

  await knex.schema.dropTable('users');
  await knex.schema.renameTable('users_new', 'users');
};

exports.down = async function(knex) {
  await knex.schema.createTable('users_old', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.string('diagnosis').defaultTo('type2_diabetes');
    t.datetime('created_at').defaultTo(knex.fn.now());
    t.datetime('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    INSERT INTO users_old (id, name, email, password_hash, diagnosis, created_at, updated_at)
    SELECT id, COALESCE(name, ''), COALESCE(email, ''), password_hash, diagnosis, created_at, updated_at FROM users
  `);

  await knex.schema.dropTable('users');
  await knex.schema.renameTable('users_old', 'users');
};
