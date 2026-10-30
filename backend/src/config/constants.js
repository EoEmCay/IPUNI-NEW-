const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

// Các giá trị này từng nằm trong mã nguồn / tài liệu công khai trên GitHub nên coi như đã lộ.
// Production mà dùng một trong số này = coi như không có khóa -> chặn khởi động.
const LEAKED_SECRETS = new Set([
  'diaplus-secret-key-dev-only',
  'ipuni-secret-key-change-in-production',
  'ipuni-admin-dev-key',
  'ipuni-cron-dev-key',
]);

if (isProduction) {
  const missing = ['JWT_SECRET', 'ADMIN_DASHBOARD_KEY'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`FATAL: thiếu biến môi trường bắt buộc ở production: ${missing.join(', ')}`);
  }
  const leaked = ['JWT_SECRET', 'ADMIN_DASHBOARD_KEY', 'CRON_SECRET']
    .filter((key) => process.env[key] && LEAKED_SECRETS.has(process.env[key]));
  if (leaked.length > 0) {
    throw new Error(`FATAL: ${leaked.join(', ')} đang dùng giá trị đã lộ công khai. Hãy đặt giá trị ngẫu nhiên mới trên Render rồi deploy lại.`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('[Cảnh báo] JWT_SECRET ngắn hơn 32 ký tự. Nên dùng chuỗi ngẫu nhiên dài (vd: openssl rand -hex 32).');
  }
}

// Ngoài production: không có giá trị mặc định đoán được. Thiếu JWT_SECRET thì sinh khóa ngẫu nhiên
// cho riêng lần chạy này (restart là đăng nhập lại) - an toàn hơn một chuỗi cố định trong mã nguồn.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[Dev] JWT_SECRET chưa đặt: dùng khóa ngẫu nhiên tạm thời, token sẽ mất hiệu lực khi khởi động lại server.');
}

module.exports = {
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  METRIC_TYPES: ['fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep'],
  ADVICE_CATEGORIES: ['should_eat', 'should_avoid', 'exercise', 'danger_sign'],
  // Admin Dashboard
  // Không có mặc định: thiếu key thì adminAuth.middleware.js khóa hẳn các endpoint quản trị.
  ADMIN_DASHBOARD_KEY: process.env.ADMIN_DASHBOARD_KEY || '',
  // OAuth client ID của web (công khai, trùng với frontend/src/main.jsx). Dùng để kiểm tra
  // access token Google gửi lên đúng là cấp cho DIA+, không phải cho app khác.
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '1081815970127-p67o922i2g7vdc6leqkj1f1e5rq1du6d.apps.googleusercontent.com',
  // Đăng nhập Facebook: App ID công khai; App Secret CHỈ đặt trong biến môi trường (Render),
  // dùng để hỏi Facebook xác nhận token đúng là cấp cho ứng dụng DIA+.
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '1079188341707422', // ID ứng dụng (công khai)
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  // Cron ngoài (Render Cron Job) gọi POST /api/v1/jobs/missed-dose-check kèm header X-Cron-Secret.
  // Không có giá trị mặc định: thiếu biến này thì cronAuth.middleware.js từ chối mọi request (401);
  // job setInterval trong process vẫn chạy làm phương án dự phòng.
  CRON_SECRET: process.env.CRON_SECRET || '',
};
