const crypto = require('crypto');

// Bộ nhớ tạm cho các yêu cầu đăng nhập đang chờ phê duyệt từ thiết bị khác.
// Dùng Map trong RAM (không cần bảng DB) vì mỗi request chỉ sống tối đa 60s -
// mất khi restart server là chấp nhận được, thiết bị B sẽ chỉ cần đăng nhập lại.
const REQUEST_TTL_MS = 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;
const RETENTION_AFTER_RESOLVE_MS = 5 * 60 * 1000; // giữ lại thêm ít phút để login-status vẫn đọc được kết quả

const store = new Map();

function isExpired(entry, now = Date.now()) {
  return entry.status === 'pending' && now > entry.expiresAt;
}

function create(userId, identifier) {
  const requestId = crypto.randomUUID();
  const now = Date.now();
  store.set(requestId, {
    requestId,
    userId,
    identifier,
    status: 'pending',
    token: null,
    user: null,
    createdAt: now,
    expiresAt: now + REQUEST_TTL_MS,
  });
  return requestId;
}

function get(requestId) {
  const entry = store.get(requestId);
  if (!entry) return null;
  if (isExpired(entry)) entry.status = 'expired';
  return entry;
}

function listPendingForUser(userId) {
  const now = Date.now();
  const result = [];
  for (const entry of store.values()) {
    if (entry.userId !== userId) continue;
    if (isExpired(entry, now)) {
      entry.status = 'expired';
      continue;
    }
    if (entry.status === 'pending') result.push(entry);
  }
  return result;
}

function approve(requestId, token, user) {
  const entry = store.get(requestId);
  if (!entry) return null;
  entry.status = 'approved';
  entry.token = token;
  entry.user = user;
  return entry;
}

function reject(requestId) {
  const entry = store.get(requestId);
  if (!entry) return null;
  entry.status = 'rejected';
  return entry;
}

function sweep() {
  const now = Date.now();
  for (const [requestId, entry] of store.entries()) {
    if (isExpired(entry, now)) entry.status = 'expired';
    if (entry.status !== 'pending' && now - entry.createdAt > RETENTION_AFTER_RESOLVE_MS) {
      store.delete(requestId);
    }
  }
}

const sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

module.exports = { create, get, listPendingForUser, approve, reject };
