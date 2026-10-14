const svc = require('./advice.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getAdvice(req, res, next) {
  try { sendSuccess(res, await svc.getAdvice(req.query.category)); } catch (err) { next(err); }
}

async function getAdviceById(req, res, next) {
  try {
    sendSuccess(res, await svc.getAdviceById(req.params.id));
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function analyzeMeal(req, res, next) {
  try {
    const { mealText, imageBase64, mimeType } = req.body || {};
    if (!mealText && !imageBase64) {
      return sendError(res, 'Vui lòng nhập món ăn hoặc chọn ảnh phần ăn để AI phân tích', 400);
    }

    const cleanText = String(mealText || '').trim().slice(0, 1000);
    if (imageBase64) {
      if (typeof imageBase64 !== 'string') {
        return sendError(res, 'Định dạng dữ liệu ảnh không hợp lệ', 400);
      }
      // Giới hạn chuỗi base64 tối đa ~10MB (tương đương ảnh gốc ~7.5MB) để chống tràn RAM
      if (imageBase64.length > 10 * 1024 * 1024) {
        return sendError(res, 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 7MB)', 413);
      }
    }

    const cleanMime = mimeType && ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mimeType)
      ? mimeType
      : 'image/jpeg';

    const result = await svc.analyzeMealWithAI({ mealText: cleanText, imageBase64, mimeType: cleanMime });
    sendSuccess(res, result, 'Phân tích khẩu phần ăn thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { getAdvice, getAdviceById, analyzeMeal };
