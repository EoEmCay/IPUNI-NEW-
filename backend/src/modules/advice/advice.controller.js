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
    const result = await svc.analyzeMealWithAI({ mealText, imageBase64, mimeType });
    sendSuccess(res, result, 'Phân tích khẩu phần ăn thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { getAdvice, getAdviceById, analyzeMeal };
