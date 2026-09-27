/**
 * Tài khoản dùng thử (email demo_...) không được liên kết gia đình với tài khoản thật.
 * Xoá các liên kết 'family_account' lỡ tạo ra trước khi có quy tắc này (idempotent).
 */
exports.up = async function (knex) {
  const links = await knex('care_links as l')
    .join('users as p', 'p.id', 'l.patient_id')
    .join('users as m', 'm.id', 'l.member_id')
    .where('l.relation', 'family_account')
    .select('l.id', 'p.email as pe', 'm.email as me');
  const isDemo = (e) => Boolean(e && e.startsWith('demo_'));
  const ids = links.filter((l) => isDemo(l.pe) !== isDemo(l.me)).map((l) => l.id);
  if (ids.length) await knex('care_links').whereIn('id', ids).delete();
};

exports.down = async function () { /* không khôi phục liên kết vi phạm quy tắc */ };
