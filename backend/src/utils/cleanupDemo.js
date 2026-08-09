const db = require('../config/database');
const logger = require('./logger');

// Chống chạy chồng: nếu 1 lượt dọn dẹp bị kẹt lâu hơn chu kỳ 10 phút (khoá bảng, thiếu
// index trên user_id khi lượng user tăng lên...), các lượt gọi tiếp theo từ setInterval
// sẽ chồng lên nhau, mỗi lượt giữ 1 kết nối từ connection pool (chỉ có tối đa 10 theo cấu
// hình production) - cạn pool ảnh hưởng luôn tới request của người dùng thật.
let isCleanupRunning = false;

async function cleanupExpiredDemos() {
  if (isCleanupRunning) {
    logger.warn('[Cleanup] Lượt dọn dẹp trước vẫn đang chạy, bỏ qua lượt này.');
    return;
  }
  isCleanupRunning = true;
  try {
    // 30 minutes in milliseconds
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Find users where email starts with demo_ and created_at < 30 mins ago
    const expiredUsers = await db('users')
      .where('email', 'like', 'demo_%@ipuni.com')
      .andWhere('created_at', '<', thirtyMinutesAgo)
      .select('id', 'email');

    if (!expiredUsers || expiredUsers.length === 0) {
      return; 
    }

    const userIds = expiredUsers.map(u => u.id);
    logger.info(`[Cleanup] Bắt đầu dọn dẹp ${userIds.length} tài khoản demo hết hạn.`);

    // Delete child records first to respect FK constraints
    await db('metrics').whereIn('user_id', userIds).del();
    await db('medications').whereIn('user_id', userIds).del();
    await db('appointments').whereIn('user_id', userIds).del();
    
    const hasScanUsages = await db.schema.hasTable('scan_usages');
    if (hasScanUsages) {
      await db('scan_usages').whereIn('user_id', userIds).del();
    }
    
    // Delete the users
    await db('users').whereIn('id', userIds).del();
    
    logger.info(`[Cleanup] Dọn dẹp thành công ${userIds.length} tài khoản demo.`);
  } catch (error) {
    logger.error(`[Cleanup] Lỗi dọn dẹp tài khoản demo: ${error.message}`);
  } finally {
    isCleanupRunning = false;
  }
}

module.exports = { cleanupExpiredDemos };
