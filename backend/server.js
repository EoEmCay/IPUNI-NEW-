require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`[Hệ thống] Nhận yêu cầu: ${req.method} ${req.originalUrl}`);
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/medications', medicationsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/advice', adviceRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/scan', scanRoutes);

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
    logger.error(`[Hệ thống] Lỗi khi chạy db init: ${err.message}`);
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
