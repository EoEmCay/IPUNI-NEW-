const svc = require('./scan.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');
const db = require('../../config/database');

async function analyzePrescription(req, res, next) {
  try {
    if (!req.file) return sendError(res, 'Vui lòng chọn ảnh đơn thuốc', 400);

    const user = req.user;

    // Check plan limit
    if (user.plan === 'free') {
      const thisMonth = await db('scan_usages')
        .where('user_id', user.id)
        .whereBetween('scanned_at', [
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        ])
        .count('* as count')
        .first();

      const usedCount = thisMonth?.count || 0;
      if (usedCount >= 3) {
        return sendError(res, 'Bạn đã dùng hết 3 lần chụp trong tháng này. Nâng cấp Pro để sử dụng không giới hạn.', 429);
      }
    }

    const result = await svc.analyzePrescription(req.file.buffer, req.file.mimetype);

    // Track usage
    await db('scan_usages').insert({
      user_id: user.id,
      result: result.isDiabetesPrescription ? 'success' : 'rejected',
    });

    sendSuccess(res, result, 'Phân tích đơn thuốc thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { analyzePrescription };
