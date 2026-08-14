function sendSuccess(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function sendError(res, message = 'Error', status = 400, code) {
  return res.status(status).json({ success: false, data: null, message, ...(code ? { code } : {}) });
}

module.exports = { sendSuccess, sendError };
