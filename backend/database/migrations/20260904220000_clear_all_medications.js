exports.up = async function(knex) {
  // Xóa sạch toàn bộ danh mục thuốc của các tài khoản để đảm bảo tài khoản trắng 100%
  const hasMedications = await knex.schema.hasTable('medications');
  if (hasMedications) {
    await knex('medications').del();
  }

  const hasMetrics = await knex.schema.hasTable('metrics');
  if (hasMetrics) {
    await knex('metrics').del();
  }

  const hasAppointments = await knex.schema.hasTable('appointments');
  if (hasAppointments) {
    await knex('appointments').del();
  }

  const hasScanUsages = await knex.schema.hasTable('scan_usages');
  if (hasScanUsages) {
    await knex('scan_usages').del();
  }
};

exports.down = function(knex) {
  return Promise.resolve();
};
