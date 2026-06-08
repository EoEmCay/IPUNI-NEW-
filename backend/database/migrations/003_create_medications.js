exports.up = function(knex) {
  return knex.schema.createTable('medications', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.string('name').notNullable();
    t.string('dosage').notNullable();
    t.string('frequency').notNullable();
    t.text('times').notNullable();
    t.text('instructions');
    t.string('doctor_name');
    t.date('prescribed_at');
    t.integer('is_active').defaultTo(1);
    t.datetime('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('medications');
};
