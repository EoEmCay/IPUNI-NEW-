const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function login(req, res, next) {
  try {
    const { identifier, password } = req.validatedBody;
    const result = await authService.login(identifier, password);
    sendSuccess(res, result, 'Đăng nhập thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { cccd, phone, password } = req.validatedBody;
    const result = await authService.register(cccd, phone, password);
    sendSuccess(res, result, 'Đăng ký thành công', 201);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

function logout(req, res) {
  sendSuccess(res, null, 'Đăng xuất thành công');
}

module.exports = { login, register, getMe, logout };
