const express = require('express');
const router = express.Router();
const { cronAuth } = require('../../middlewares/cronAuth.middleware');
const { sendSuccess } = require('../../utils/response.helper');
const { runMissedDoseCheck } = require('../../jobs/missedDoseChecker');
const logger = require('../../utils/logger');

// ============================================================================
// KÍCH HOẠT JOB TỪ SCHEDULER NGOÀI (Render Cron Job / bất kỳ cron ngoài nào):
// Trước đây job kiểm tra bỏ thuốc CHỈ chạy bằng setInterval bên trong chính process Node
// (xem backend/src/jobs/missedDoseChecker.js#startMissedDoseJob) - nếu server ngủ/restart
// (rất hay gặp ở hosting free-tier), cảnh báo "bỏ thuốc" cho người nhà ngừng hẳn cho tới khi
// có request nào đó đánh thức server dậy. Endpoint này cho phép 1 scheduler THỰC SỰ ở NGOÀI
// process (xem render.yaml - khai báo sẵn 1 Render Cron Job gọi vào đây mỗi 5 phút) chủ động
// gọi vào kích hoạt job, độc lập với server có đang "thức" theo traffic người dùng hay không.
// setInterval in-process vẫn được giữ nguyên làm phương án dự phòng khi server đang thức sẵn.
// runMissedDoseCheck() đã idempotent (dedupe theo medication_id+scheduled_for, cờ
// notified_caregiver) nên gọi trùng từ cả 2 nguồn (cron ngoài + setInterval) là an toàn.
// ============================================================================
router.post('/missed-dose-check', cronAuth, async (req, res, next) => {
  try {
    await runMissedDoseCheck();
    sendSuccess(res, { ranAt: new Date().toISOString() }, 'Đã chạy kiểm tra liều thuốc bỏ quên');
  } catch (err) {
    logger.error(`[Jobs] Lỗi khi cron ngoài kích hoạt missed-dose-check: ${err.message}`, err);
    next(err);
  }
});

module.exports = router;
