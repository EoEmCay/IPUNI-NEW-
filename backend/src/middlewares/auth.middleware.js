const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { sendError } = require('../utils/response.helper');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
}

module.exports = { authMiddleware };
