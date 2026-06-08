const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/constants');

function signToken(user) {
  return jwt.sign(
    { id: user.id, cccd: user.cccd, phone: user.phone, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function login(identifier, password) {
  let user = await db('users').where({ email: identifier }).first();
  if (!user) user = await db('users').where({ cccd: identifier }).first();
  if (!user) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  const token = signToken(user);
  return { token, user: { id: user.id, name: user.name, email: user.email, cccd: user.cccd, phone: user.phone, diagnosis: user.diagnosis } };
}

async function register(cccd, phone, password) {
  const existingCccd = await db('users').where({ cccd }).first();
  if (existingCccd) throw { status: 409, message: 'CCCD đã được đăng ký' };

  const existingPhone = await db('users').where({ phone }).first();
  if (existingPhone) throw { status: 409, message: 'Số điện thoại đã được đăng ký' };

  const password_hash = await bcrypt.hash(password, 10);
  const [id] = await db('users').insert({ cccd, phone, password_hash });
  const user = await db('users').where({ id }).first();

  const token = signToken(user);
  return { token, user: { id: user.id, cccd: user.cccd, phone: user.phone, diagnosis: user.diagnosis } };
}

async function getMe(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return { id: user.id, name: user.name, email: user.email, cccd: user.cccd, phone: user.phone, diagnosis: user.diagnosis, created_at: user.created_at };
}

module.exports = { login, register, getMe };
