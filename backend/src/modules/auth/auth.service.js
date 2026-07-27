const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/constants');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, phone: user.phone },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function login(identifier, password) {
  const user = await db('users').where({ email: identifier }).first();
  if (!user) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  const token = signToken(user);
  const is_demo = user.email && user.email.startsWith('demo_');
  return { 
    token, 
    user: { 
      id: user.id, user_code: user.user_code, name: user.name, 
      address: user.address, email: user.email, phone: user.phone, 
      diagnosis: user.diagnosis, plan: user.plan,
      is_demo, created_at: is_demo ? user.created_at : undefined 
    } 
  };
}

function genUserCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DIA';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function register(email, phone, password, { name, diagnosis } = {}) {
  const existingEmail = await db('users').where({ email }).first();
  if (existingEmail) throw { status: 409, message: 'Email này đã được đăng ký' };

  if (phone) {
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) throw { status: 409, message: 'Số điện thoại này đã được đăng ký' };
  }

  const password_hash = await bcrypt.hash(password, 10);
  let user_code;
  do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());

  const insertData = { email, password_hash, user_code };
  if (phone) insertData.phone = phone;
  if (name) insertData.name = name;
  if (diagnosis) insertData.diagnosis = diagnosis;

  const [insertedRow] = await db('users').insert(insertData).returning('id');
  const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
  const user = await db('users').where({ id }).first();

  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id, user_code: user.user_code, name: user.name,
      email: user.email, phone: user.phone,
      diagnosis: user.diagnosis, plan: user.plan,
    },
  };
}

async function getMe(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };
  return {
    id: user.id, user_code: user.user_code, name: user.name, email: user.email,
    address: user.address, phone: user.phone,
    date_of_birth: user.date_of_birth, blood_type: user.blood_type,
    allergies: user.allergies, insurance_number: user.insurance_number,
    insurance_expiry: user.insurance_expiry,
    diagnosis: user.diagnosis, plan: user.plan, created_at: user.created_at,
    is_demo: user.email && user.email.startsWith('demo_')
  };
}

async function googleMock(email) {
  let user = await db('users').where({ email }).first();
  if (!user) {
    let user_code;
    do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());
    
    // Tạo user mới với mật khẩu mặc định (vì đăng nhập Google không cần pass)
    const [insertedRow] = await db('users').insert({
      email,
      name: email.split('@')[0],
      password_hash: '$2b$10$dummyHashGoogleMockUserNotUsed',
      user_code,
    }).returning('id');
    const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
    user = await db('users').where({ id }).first();
  }

  const token = signToken(user);
  return { token, user: { id: user.id, user_code: user.user_code, name: user.name, address: user.address, email: user.email, phone: user.phone, diagnosis: user.diagnosis, plan: user.plan } };
}

async function demoLogin() {
  const suffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const email = `demo_${suffix}@ipuni.com`;
  
  let user_code;
  do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());
  
  // Sử dụng chuỗi băm tính trước cho 'demo_mock' để tăng tốc độ load, tránh quá tải CPU trên các server nhỏ
  const password_hash = '$2a$10$znBEfjEODDkbHtifoiREvuPZpM7AJ9CIUdUpwqlDSztp8H5R4g0j2';
  const [insertedRow] = await db('users').insert({
    email,
    name: 'Người Dùng Demo',
    password_hash,
    user_code,
    diagnosis: 'type2_diabetes',
    plan: 'pro'
  }).returning('id');
  
  const userId = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
  
  // Không nạp dữ liệu thuốc mặc định nữa, để màn hình trống cho demo quét đơn thuốc
  const user = await db('users').where({ id: userId }).first();
  const token = signToken(user);
  return {
    token,
    user: { 
      id: user.id, user_code: user.user_code, name: user.name, 
      email: user.email, phone: user.phone, diagnosis: user.diagnosis, 
      plan: user.plan, is_demo: true, created_at: user.created_at 
    },
  };
}

module.exports = { login, register, getMe, googleMock, demoLogin };
