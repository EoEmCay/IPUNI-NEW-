function sendSuccess(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function sendError(res, message = 'Error', status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

module.exports = { sendSuccess, sendError };
