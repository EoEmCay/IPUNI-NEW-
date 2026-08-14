const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { sendError } = require('../utils/response.helper');

// Chỉ ghi lại last_active_at nếu bản ghi cũ đã "nguội" hơn ngưỡng này, để không tạo
// một lệnh UPDATE cho mỗi request (app gọi API liên tục khi đang mở). Ngưỡng này phải
// nhỏ hơn ACTIVE_SESSION_THRESHOLD_MS bên auth.service.js để phát hiện thiết bị đang hoạt động kịp thời.
const LAST_ACTIVE_UPDATE_THROTTLE_MS = 20 * 1000;

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }
  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }

  // Từ đây trở đi, token JWT đã được xác thực hợp lệ — mọi lỗi tiếp theo (DB chập chờn,
  // pool nguội sau khi idle...) là lỗi hạ tầng, KHÔNG được trả 401. Frontend (api.js) coi
  // 401 = "phiên hết hạn" và tự đăng xuất + redirect /login ngay lập tức; một lần DB hiccup
  // thoáng qua (dễ gặp nhất ngay sau khi vừa đăng nhập) sẽ đá người dùng ra ngoài oan.
  try {
    const db = require('../config/database');
    const user = await db('users').where({ id: decoded.id }).first();

    if (!user) {
      return sendError(res, 'Người dùng không tồn tại', 401);
    }

    const lastActiveAgeMs = user.last_active_at ? Date.now() - new Date(user.last_active_at).getTime() : Infinity;
    if (lastActiveAgeMs > LAST_ACTIVE_UPDATE_THROTTLE_MS) {
      // Fire-and-forget: không chặn response vì chuyện này chỉ để dò "thiết bị có đang hoạt động không".
      db('users').where({ id: user.id }).update({ last_active_at: new Date().toISOString() }).catch(() => {});
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
    return sendError(res, 'Lỗi máy chủ, vui lòng thử lại', 500);
  }
}

module.exports = { authMiddleware };
