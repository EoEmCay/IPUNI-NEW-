exports.up = function(knex) {
  return knex.schema.createTable('metrics', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.string('type').notNullable();
    t.float('value').notNullable();
    t.datetime('measured_at').notNullable();
    t.text('note');
    t.datetime('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('metrics');
};
