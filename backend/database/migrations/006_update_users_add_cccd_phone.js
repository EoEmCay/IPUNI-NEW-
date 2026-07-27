exports.up = async function(knex) {
  // Use alter table for PostgreSQL compatibility
  const hasCccd = await knex.schema.hasColumn('users', 'cccd');
  if (!hasCccd) {
    await knex.schema.alterTable('users', (t) => {
      t.string('cccd', 12).unique();
      t.string('phone').unique();
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('cccd');
    t.dropColumn('phone');
  });
};
