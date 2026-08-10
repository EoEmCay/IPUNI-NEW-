exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.integer('token_version').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('token_version');
  });
};
