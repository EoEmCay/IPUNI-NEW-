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
const careLinksRoutes = require('./src/modules/users/careLinks.routes');
const scanRoutes = require('./src/modules/scan/scan.routes');
const analyticsRoutes = require('./src/modules/analytics/analytics.routes');
const ttsRoutes = require('./src/modules/tts/tts.routes');
const jobsRoutes = require('./src/modules/jobs/jobs.routes');
const careRoutes = require('./src/modules/care/care.routes');

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

// 2. CORS: chỉ cho phép đúng các domain của DIA+ (danh sách trắng).
// Origin lạ KHÔNG bị lỗi 500 mà đơn giản là không được cấp header CORS, trình duyệt sẽ tự chặn.
// Domain preview cụ thể (vd bản Vercel preview) thêm qua biến môi trường PREVIEW_FRONTEND_URL,
// KHÔNG mở cả đuôi *.vercel.app hay *.web.vn vì ai cũng đăng ký được subdomain của chúng.
const allowedOrigins = new Set([
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost',         // WebView Capacitor Android (androidScheme: 'https')
  'capacitor://localhost',     // WebView Capacitor iOS
  'http://localhost',
  'https://diaplus-v2.vercel.app',
  'https://diaplus.vn',
  'https://www.diaplus.vn',
  'https://web.vn',
  'https://www.web.vn',
  process.env.FRONTEND_URL,
  process.env.PREVIEW_FRONTEND_URL,
].filter(Boolean));

function isAllowedOrigin(origin) {
  if (!origin) return true; // app native, cron, curl: không có header Origin
  if (allowedOrigins.has(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.diaplus.vn'); // subdomain của chính DIA+
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    logger.warn(`[CORS] Chặn origin không nằm trong danh sách: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
}));

// Body JSON mặc định 1MB. Chỉ endpoint phân tích bữa ăn (ảnh base64, tối đa ~10MB) được nới.
// Quét đơn thuốc dùng multipart/multer nên không đi qua đây.
app.use('/api/v1/advice/analyze-meal', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`[Hệ thống] Nhận yêu cầu: ${req.method} ${req.originalUrl}`);
  next();
});

// 3. Rate limiting. Mặc định đặt vừa phải cho dùng thật; chỉnh bằng biến môi trường trên Render
// nếu một mạng chung IP (vd wifi bệnh viện, 4G dùng chung) bị chặn nhầm - không cần sửa code.
const envInt = (name, fallback) => {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: envInt('RATE_LIMIT_API_MAX', 600), // 600 request / 15 phút / IP (~40 mỗi phút)
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: envInt('RATE_LIMIT_AUTH_MAX', 100), // 100 lần gọi /auth / 15 phút / IP; dò mật khẩu từng tài khoản còn bị loginAccountLimiter chặn riêng
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

// Chống dò mật khẩu nhắm vào MỘT tài khoản: authLimiter ở trên tính theo IP nên kẻ tấn công
// đổi IP là thử tiếp được. Tầng này tính theo tài khoản (identifier) và chỉ đếm lần SAI.
// ponytail: bộ đếm trong RAM của 1 process - đủ cho 1 instance Render; chạy nhiều instance thì chuyển sang store Redis.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${String(req.body?.identifier || '').trim().toLowerCase()}`,
  message: { message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc bấm "Quên mật khẩu".' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trang admin xem được danh sách toàn bộ người dùng: chỉ cho sai key 20 lần / 15 phút / IP.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  skip: (req) => req.path === '/track', // endpoint đếm lượt xem công khai, không cần key
  message: { message: 'Sai key quản trị quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// /analytics/track là endpoint công khai ghi vào DB nên cần trần riêng để không bị spam đầy bảng.
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envInt('RATE_LIMIT_TRACK_MAX', 120),
  message: { message: 'Quá nhiều sự kiện từ địa chỉ này.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giới hạn cho các endpoint gọi AI (Gemini Bữa ăn / Quét đơn) để bảo vệ quota & chi phí
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // 40 lượt gọi AI / 15 phút / IP
  message: { message: 'Bạn đã thực hiện quá nhiều yêu cầu phân tích AI. Vui lòng thử lại sau vài phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Phía sau proxy của Render: lấy IP thật của client (phải đặt trước các limiter).
app.set('trust proxy', 1);

// Áp dụng giới hạn chung cho toàn bộ API
app.use('/api/', apiLimiter);

const dashboardRoutes = require('./src/modules/dashboard/dashboard.routes');

app.use('/api/v1/auth/register-otp', otpLimiter);
app.use('/api/v1/auth/verify-otp', otpLimiter);
app.use('/api/v1/auth/forgot-password-otp', otpLimiter);
app.use('/api/v1/auth/verify-reset-otp', otpLimiter);
app.use('/api/v1/auth/login', loginAccountLimiter);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/medications', medicationsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/advice/analyze-meal', aiLimiter);
app.use('/api/v1/advice', adviceRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/care-links', careLinksRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/analytics/track', trackLimiter);
app.use('/api/v1/analytics', adminLimiter, analyticsRoutes);
app.use('/api/v1/tts', ttsRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/care', careRoutes);
app.use('/api/v1/insights', careRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

const db = require('./src/config/database');
const { startMissedDoseJob } = require('./src/jobs/missedDoseChecker');
const { startDoseReminderJob } = require('./src/jobs/doseReminder');
const { startTelegramBot } = require('./src/jobs/telegramBot');

async function startServer() {
  try {
    await db.migrate.latest();
    logger.info('[Hệ thống] Đã chạy migrations thành công');
    // await db.seed.run();
    // logger.info('[Hệ thống] Đã chạy seeds thành công');
  } catch (err) {
    logger.error(`[Hệ thống] Lỗi khi chạy db init: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`[Hệ thống] Server DIA+ đang khởi động và chạy thành công trên cổng: ${PORT}`);

    // Khởi chạy job kiểm tra cữ thuốc bị bỏ quên để cảnh báo người nhà
    try {
      startMissedDoseJob();
      logger.info('[Hệ thống] Đã khởi động job kiểm tra liều thuốc quên định kỳ (5 phút)');
    } catch (e) {
      logger.error(`[Hệ thống] Lỗi khởi động MissedDoseJob: ${e.message}`);
    }

    // Nhắc uống thuốc qua Telegram / Zalo ZNS (mỗi kênh tự tắt khi chưa cấu hình)
    try {
      startDoseReminderJob();
      startTelegramBot();
    } catch (e) {
      logger.error(`[Hệ thống] Lỗi khởi động nhắc thuốc ngoài app: ${e.message}`);
    }
  });
  server.timeout = 300000;
}

process.on('unhandledRejection', (reason) => {
  logger.error('[UnhandledRejection]', reason);
});

startServer();
