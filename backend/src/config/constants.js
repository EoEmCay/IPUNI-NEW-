const isProduction = process.env.NODE_ENV === 'production';

// Fail-fast: một secret đoán được (hardcode trong source công khai) mà server vẫn
// chạy bình thường thì coi như không có bảo vệ gì. Chặn khởi động ngay thay vì chỉ log.
if (isProduction) {
  const missing = ['JWT_SECRET', 'ADMIN_DASHBOARD_KEY'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`🚨 FATAL: thiếu biến môi trường bắt buộc ở production: ${missing.join(', ')}`);
  }
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'diaplus-secret-key-dev-only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  METRIC_TYPES: ['fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep'],
  ADVICE_CATEGORIES: ['should_eat', 'should_avoid', 'exercise', 'danger_sign'],
  // Admin Dashboard
  ADMIN_DASHBOARD_KEY: process.env.ADMIN_DASHBOARD_KEY || 'ipuni-admin-dev-key',
  GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  // Cron ngoài (Render Cron Job / bất kỳ scheduler ngoài nào) gọi vào để kích hoạt các job
  // định kỳ (vd kiểm tra bỏ thuốc) mà KHÔNG phụ thuộc process Node có đang thức hay không -
  // xem backend/src/modules/jobs/. Không đặt trong danh sách fail-fast bắt buộc (không crash
  // server) vì job vẫn có setInterval in-process làm phương án dự phòng khi chưa cấu hình cron
  // ngoài. NHƯNG ở production, KHÔNG được rơi về chuỗi mặc định đoán được (repo public trên
  // GitHub, ai cũng đọc được 'ipuni-cron-dev-key') - nếu biến môi trường thật sự chưa tới được
  // process (vd nền tảng hosting không nạp đúng), CRON_SECRET sẽ là '' và cronAuth.middleware.js
  // tự khoá hẳn endpoint (401 với mọi request) thay vì vô tình bảo vệ bằng key công khai.
  CRON_SECRET: process.env.CRON_SECRET || (isProduction ? '' : 'ipuni-cron-dev-key'),
};
