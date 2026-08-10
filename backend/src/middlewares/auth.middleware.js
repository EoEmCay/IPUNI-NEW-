const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { sendError } = require('../utils/response.helper');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check token version in DB
    const db = require('../config/database');
    const user = await db('users').where({ id: decoded.id }).first();
    
    if (!user) {
      return sendError(res, 'Người dùng không tồn tại', 401);
    }

    if (user.token_version > (decoded.token_version || 1)) {
      // Mismatch: a newer login exists.
      // Bypass this check if they are explicitly acknowledging the session to get a new token.
      if (!req.path.includes('/acknowledge-session')) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn do tài khoản được đăng nhập ở nơi khác',
          code: 'SESSION_CONFLICT'
        });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
}

module.exports = { authMiddleware };
