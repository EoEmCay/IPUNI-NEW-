// Script dùng 1 LẦN để dọn sạch database production trước khi bắt đầu dùng thật.
// Giữ lại ĐÚNG 1 tài khoản (mặc định: khoi@example.com) nhưng xoá sạch dữ liệu bên
// trong tài khoản đó luôn (chỉ số, thuốc, lịch hẹn, lượt quét) - coi như 1 tài khoản
// trống hoàn toàn, sẵn sàng dùng thật. KHÔNG đụng tới bảng `advice` (nội dung lời
// khuyên tĩnh của app, không phải dữ liệu người dùng).
//
// CÁCH CHẠY (trên Render, KHÔNG chạy ở máy local vì local không có DATABASE_URL thật):
//   1. Vào Render Dashboard -> service backend -> tab "Shell"
//   2. Chạy trước (không xoá gì cả, chỉ xem sẽ xoá bao nhiêu):
//        node scripts/resetForLaunch.js
//   3. Nếu số liệu đúng như mong đợi, chạy thật với cờ --confirm:
//        node scripts/resetForLaunch.js --confirm
//
// Muốn giữ lại email khác thay vì khoi@example.com:
//        KEEP_EMAIL=you@example.com node scripts/resetForLaunch.js --confirm

require('dotenv').config();
const db = require('./../src/config/database');

const KEEP_EMAIL = process.env.KEEP_EMAIL || 'khoi@example.com';
const CONFIRMED = process.argv.includes('--confirm');

async function main() {
  const keepUser = await db('users').where({ email: KEEP_EMAIL }).first();
  if (!keepUser) {
    console.error(`❌ Không tìm thấy tài khoản "${KEEP_EMAIL}" trong database. Dừng lại, không xoá gì cả.`);
    process.exit(1);
  }

  const [{ count: totalUsers }] = await db('users').count('id as count');
  const otherUserIds = (await db('users').whereNot('id', keepUser.id).select('id')).map((u) => u.id);

  const countFor = async (table, ids) => {
    const has = await db.schema.hasTable(table);
    if (!has) return 0;
    const [{ count }] = await db(table).whereIn('user_id', ids).count('id as count');
    return Number(count);
  };

  const allUserIds = [keepUser.id, ...otherUserIds];
  const metricsCount = await countFor('metrics', allUserIds);
  const medsCount = await countFor('medications', allUserIds);
  const apptCount = await countFor('appointments', allUserIds);
  const scanCount = await countFor('scan_usages', allUserIds);

  console.log('=== XEM TRƯỚC (chưa xoá gì) ===');
  console.log(`Tổng số tài khoản hiện có: ${totalUsers}`);
  console.log(`Tài khoản GIỮ LẠI: ${KEEP_EMAIL} (id=${keepUser.id}) - sẽ bị xoá RỖNG dữ liệu, nhưng KHÔNG xoá tài khoản.`);
  console.log(`Số tài khoản khác sẽ bị XOÁ HẲN: ${otherUserIds.length}`);
  console.log(`Tổng số chỉ số (metrics) sẽ xoá (mọi user, kể cả tài khoản giữ lại): ${metricsCount}`);
  console.log(`Tổng số thuốc (medications) sẽ xoá: ${medsCount}`);
  console.log(`Tổng số lịch hẹn (appointments) sẽ xoá: ${apptCount}`);
  console.log(`Tổng số lượt quét (scan_usages) sẽ xoá: ${scanCount}`);
  console.log('Bảng `advice` (lời khuyên tĩnh) SẼ KHÔNG bị đụng tới.');

  if (!CONFIRMED) {
    console.log('\n⚠️  Đây mới là XEM TRƯỚC. Chưa xoá gì cả.');
    console.log('    Nếu số liệu trên đúng như mong đợi, chạy lại kèm --confirm để xoá thật.');
    process.exit(0);
  }

  console.log('\n🔄 --confirm được truyền vào, bắt đầu xoá thật...');

  await db('metrics').whereIn('user_id', allUserIds).del();
  await db('medications').whereIn('user_id', allUserIds).del();
  await db('appointments').whereIn('user_id', allUserIds).del();
  if (await db.schema.hasTable('scan_usages')) {
    await db('scan_usages').whereIn('user_id', allUserIds).del();
  }
  if (await db.schema.hasTable('analytics_events')) {
    await db('analytics_events').whereIn('user_id', allUserIds).del().catch(() => {});
  }

  if (otherUserIds.length > 0) {
    await db('users').whereIn('id', otherUserIds).del();
  }

  // Bump token_version để mọi phiên đăng nhập cũ (nếu có) của tài khoản giữ lại bị
  // vô hiệu hoá ngay - coi như bắt đầu lại từ đầu, sạch cả phiên đăng nhập lẫn dữ liệu.
  await db('users').where({ id: keepUser.id }).update({
    token_version: (keepUser.token_version || 1) + 1,
    last_active_at: null,
  });

  console.log(`✅ Đã xoá xong. Chỉ còn lại tài khoản "${KEEP_EMAIL}", dữ liệu rỗng hoàn toàn, sẵn sàng dùng thật.`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
