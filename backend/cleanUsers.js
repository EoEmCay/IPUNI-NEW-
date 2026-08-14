require('dotenv').config();
const db = require('./src/config/database');

async function cleanAllUsers() {
  console.log('🔄 Đang tiến hành xóa sạch dữ liệu người dùng...');

  try {
    const tables = [
      'analytics_events',
      'scan_usages',
      'advice',
      'appointments',
      'medications',
      'metrics',
      'users'
    ];

    for (const table of tables) {
      const hasTable = await db.schema.hasTable(table);
      if (hasTable) {
        const deletedCount = await db(table).del();
        console.log(`✅ Đã xóa ${deletedCount} bản ghi từ bảng '${table}'`);
      }
    }

    console.log('🎉 Xóa toàn bộ tài khoản và dữ liệu thành công! Cơ sở dữ liệu hiện đã sạch 100%.');
  } catch (err) {
    console.error('❌ Lỗi khi dọn dẹp cơ sở dữ liệu:', err.message);
  } finally {
    await db.destroy();
  }
}

cleanAllUsers();
