/**
 * Cho phép bệnh nhân ghi lý do khi bấm "Bỏ qua" 1 cữ thuốc (tác dụng phụ, tụt đường huyết,
 * hết thuốc...), để bác sĩ trên Clinic Portal nắm được nguyên nhân y khoa thay vì chỉ thấy
 * cờ "missed"/"skipped" trơ trọi.
 *
 * KHÔNG xoá/sửa cột cũ — chỉ thêm cột mới, nullable, không ảnh hưởng dữ liệu hiện có.
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasColumn('medication_logs', 'reason'))) {
    await knex.schema.alterTable('medication_logs', (t) => {
      t.string('reason', 255).nullable();
    });
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasColumn('medication_logs', 'reason')) {
    await knex.schema.alterTable('medication_logs', (t) => {
      t.dropColumn('reason');
    });
  }
};
