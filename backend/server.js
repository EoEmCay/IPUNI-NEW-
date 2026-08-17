require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const { errorMiddleware } = require('./src/middlewares/error.middleware');

const authRoutes = require('./src/modules/auth/auth.routes');
const metricsRoutes = require('./src/modules/metrics/metrics.routes');
const medicationsRoutes = require('./src/modules/medications/medications.routes');
const appointmentsRoutes = require('./src/modules/appointments/appointments.routes');
const adviceRoutes = require('./src/modules/advice/advice.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const scanRoutes = require('./src/modules/scan/scan.routes');
const analyticsRoutes = require('./src/modules/analytics/analytics.routes');
const ttsRoutes = require('./src/modules/tts/tts.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Cài đặt Helmet (Bảo vệ Header HTTP khỏi Clickjacking, MIME sniffing, v.v. và ép buộc SSL/HSTS)
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Chuyển hướng HTTP sang HTTPS nếu đang chạy phía sau Load Balancer/Proxy (Vercel/Render)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// 2. Siết chặt CORS (Chỉ cho phép các domain được chỉ định)
// LƯU Ý: trước đây origin.endsWith('.vercel.app') chấp nhận BẤT KỲ dự án Vercel miễn phí
// nào (ai cũng deploy được 1 domain *.vercel.app) làm origin hợp lệ kèm credentials:true.
// Chỉ liệt kê đúng các domain thật cần dùng - thêm domain preview cụ thể qua biến môi
// trường thay vì mở toàn bộ TLD phụ .vercel.app.
const allowedOrigins = [
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost',         // WebView Capacitor Android (androidScheme: 'https')
  'capacitor://localhost',     // WebView Capacitor iOS
  'http://localhost',
  'https://diaplus-v2.vercel.app', // Tên miền frontend nếu có
  'https://diaplus.vn',
  'https://www.diaplus.vn',
  process.env.FRONTEND_URL,
  process.env.PREVIEW_FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`[Hệ thống] Nhận yêu cầu: ${req.method} ${req.originalUrl}`);
  next();
});

// 3. Nới lỏng Rate Limiting (Đang trong giai đoạn khảo sát người dùng)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5000, // Thả cửa 5000 request/15 phút để người dùng test thoải mái
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Nới rất rộng để không chặn nhầm người dùng thật - vẫn còn 1 trần chặn bot dò mật khẩu hàng loạt
  message: { message: 'Thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giới hạn RIÊNG cho các endpoint gửi OTP - mỗi lần gửi tốn phí SMS/email thật
// (eSMS/SpeedSMS/Gmail), nên vẫn giữ trần thấp hơn authLimiter dù đã nới rộng, để tránh bị
// lợi dụng làm SMS bombing / cạn tiền tài khoản SMS thật. otp.service.js còn giới hạn thêm
// theo TỪNG target (60s cooldown, 10 lần/ngày) - độc lập với trần theo IP ở đây.
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 100, // Tối đa 100 lần gửi OTP / IP / giờ
  message: { message: 'Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 1 giờ.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Áp dụng giới hạn chung cho toàn bộ API
app.use('/api/', apiLimiter);

app.use('/api/v1/auth/register-otp', otpLimiter);
app.use('/api/v1/auth/verify-otp', otpLimiter);
app.use('/api/v1/auth/forgot-password-otp', otpLimiter);
app.use('/api/v1/auth/verify-reset-otp', otpLimiter);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/medications', medicationsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/advice', adviceRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/tts', ttsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

const db = require('./src/config/database');
const { cleanupExpiredDemos } = require('./src/utils/cleanupDemo');

async function startServer() {
  try {
    await db.migrate.latest();
    logger.info('[Hệ thống] Đã chạy migrations thành công');
    // await db.seed.run();
    // logger.info('[Hệ thống] Đã chạy seeds thành công');
  } catch (err) {
    // Fail-fast: KHÔNG khởi động server với schema có thể sai lệch. Trước đây lỗi này chỉ
    // được log rồi server vẫn app.listen() bình thường - gây lỗi 500 rải rác khó debug thay
    // vì một lỗi khởi động rõ ràng ngay lập tức.
    logger.error(`[Hệ thống] Lỗi khi chạy db init: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`[Hệ thống] Server DIA+ đang khởi động và chạy thành công trên cổng: ${PORT}`);
    
    // Khởi chạy dọn dẹp tài khoản demo
    cleanupExpiredDemos(); // Chạy luôn lần đầu
    setInterval(() => {
      cleanupExpiredDemos();
    }, 10 * 60 * 1000); // Mỗi 10 phút
  });
  server.timeout = 300000;
}

startServer();
