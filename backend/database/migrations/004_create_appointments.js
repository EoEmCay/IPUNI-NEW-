exports.up = function(knex) {
  return knex.schema.createTable('appointments', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.string('doctor_name').notNullable();
    t.string('department');
    t.datetime('scheduled_at').notNullable();
    t.string('location');
    t.text('note');
    t.string('status').defaultTo('upcoming');
    t.datetime('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('appointments');
};
