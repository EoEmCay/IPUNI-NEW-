function toVNDatetime(date) {
  return new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function nowVN() {
  return new Date().toISOString();
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

module.exports = { toVNDatetime, nowVN, daysAgo };
