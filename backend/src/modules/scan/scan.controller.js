const svc = require('./scan.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const { findMedicationInDatabase } = require('./scan.service');

const fs = require('fs');

const db = require('../../config/database');

async function analyzePrescription(req, res, next) {
  try {
    req.setTimeout(300000);
    if (!req.file) return sendError(res, 'Vui lòng chọn ảnh đơn thuốc', 400);

    const user = req.user;

    // Check Free Plan quota limit (max 3 scans / month)
    const isDemo = user && user.email && user.email.startsWith('demo_');
    const isPro = user && user.plan === 'pro';

    if (user && !isPro && !isDemo) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const countRes = await db('scan_usages')
        .where('user_id', user.id)
        .where('scanned_at', '>=', startOfMonth)
        .count('id as count')
        .first();

      const count = parseInt(countRes?.count || 0, 10);
      if (count >= 3) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return sendError(res, 'Bạn đã sử dụng hết 3 lượt quét đơn thuốc miễn phí trong tháng này. Vui lòng nâng cấp gói PRO để quét không giới hạn.', 403);
      }
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const lang = req.body.lang || 'vi';
    const result = await svc.analyzePrescription(fileBuffer, req.file.mimetype, lang);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // Record scan usage
    if (user && user.id) {
      db('scan_usages').insert({
        user_id: user.id,
        scanned_at: db.fn.now(),
        result: result.isDiabetesPrescription ? 'prescription' : result.isLabReport ? 'lab_report' : 'other'
      }).catch(e => console.error('[Scan Usage Record Error]:', e.message));
    }

    sendSuccess(res, result, 'Phân tích đơn thuốc thành công');
  } catch (err) {
    console.error('[Scan Controller] Error:', err.message);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (err.status && err.status !== 401) return sendError(res, err.message, err.status);
    return sendError(res, err.message || 'Lỗi phân tích đơn thuốc. Vui lòng thử lại.', 500);
  }
}

async function getMedicationDetail(req, res, next) {
  try {
    const { name } = req.params;
    if (!name) return sendError(res, 'Vui lòng cung cấp tên thuốc', 400);

    const medication = findMedicationInDatabase(name);
    if (!medication) return sendError(res, 'Không tìm thấy thông tin thuốc này', 404);

    sendSuccess(res, medication, 'Thông tin chi tiết thuốc');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { analyzePrescription, getMedicationDetail };

