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

module.exports = { getAdvice, getAdviceById };
