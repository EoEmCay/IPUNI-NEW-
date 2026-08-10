exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.timestamp('last_active_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('last_active_at');
  });
};
