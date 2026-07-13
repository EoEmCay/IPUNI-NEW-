exports.up = async function(knex) {
  // Index for medications queries by user_id
  await knex.schema.table('medications', table => {
    table.index(['user_id', 'is_active']);
  });

  // Index for metrics queries by user_id and type
  await knex.schema.table('metrics', table => {
    table.index(['user_id', 'measurement_type', 'measured_at']);
  });

  // Index for appointments queries by user_id
  await knex.schema.table('appointments', table => {
    table.index(['user_id', 'status']);
  });
};

exports.down = async function(knex) {
  await knex.schema.table('medications', table => {
    table.dropIndex(['user_id', 'is_active']);
  });

  await knex.schema.table('metrics', table => {
    table.dropIndex(['user_id', 'measurement_type', 'measured_at']);
  });

  await knex.schema.table('appointments', table => {
    table.dropIndex(['user_id', 'status']);
  });
};
