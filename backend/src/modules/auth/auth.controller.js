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
    const { email, phone, password, name, diagnosis } = req.validatedBody;
    const result = await authService.register(email, phone, password, { name, diagnosis });
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

async function googleMock(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw { status: 400, message: 'Vui lòng cung cấp email' };
    const result = await authService.googleMock(email);
    sendSuccess(res, result, 'Đăng nhập Google thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

async function demoLogin(req, res, next) {
  try {
    const result = await authService.demoLogin();
    sendSuccess(res, result, 'Đăng nhập demo thành công');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = { login, register, getMe, logout, googleMock, demoLogin };
