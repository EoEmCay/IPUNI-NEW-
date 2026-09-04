exports.seed = async function(knex) {
  await knex('medications').del();
};

