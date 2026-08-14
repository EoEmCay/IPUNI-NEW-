exports.up = function(knex) {
  return knex.schema.alterTable('medications', function(t) {
    t.date('next_appointment_date');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('medications', function(t) {
    t.dropColumn('next_appointment_date');
  });
};
