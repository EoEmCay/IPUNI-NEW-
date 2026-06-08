exports.up = function(knex) {
  return knex.schema.createTable('advice', (t) => {
    t.increments('id').primary();
    t.string('category').notNullable();
    t.string('title').notNullable();
    t.text('description').notNullable();
    t.text('detail_content');
    t.string('icon_type').notNullable();
    t.integer('sort_order').defaultTo(0);
    t.integer('is_active').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('advice');
};
