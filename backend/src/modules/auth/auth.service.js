const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/constants');

function signToken(user, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      phone: user.phone, 
      diagnosis: user.diagnosis,
      token_version: user.token_version || 1
    },
    JWT_SECRET,
    { expiresIn }
  );
}

async function login(identifier, password) {
  const user = await db('users')
    .where({ email: identifier })
    .orWhere({ phone: identifier })
    .first();
  if (!user) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Thông tin đăng nhập không đúng' };

  // Increment token_version to signal a new login (without kicking out the old one immediately, 
  // frontend polling will handle it).
  const newTokenVersion = (user.token_version || 1) + 1;
  await db('users').where({ id: user.id }).update({ token_version: newTokenVersion });
  user.token_version = newTokenVersion;

  const token = signToken(user);
  const is_demo = user.email && user.email.startsWith('demo_');

  // Send Email Notification
  const GMAIL_USER = process.env.GMAIL_USER || process.env.MAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAIL_PASS;
  if (GMAIL_USER && GMAIL_PASS && user.email && !is_demo) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });
    
    // We intentionally don't await this so it doesn't block the login response
    transporter.sendMail({
      from: `"DIA+" <${GMAIL_USER}>`,
      to: user.email,
      subject: 'Cảnh báo: Đăng nhập thiết bị mới',
      html: `
        <h3>Cảnh báo bảo mật</h3>
        <p>Tài khoản DIA+ của bạn vừa được đăng nhập thành công.</p>
        <p>Nếu đây là bạn, hãy bỏ qua email này. Nếu không, hãy đổi mật khẩu ngay lập tức hoặc liên hệ hỗ trợ.</p>
        <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
      `
    }).catch(err => console.error('Lỗi gửi email đăng nhập:', err.message));
  }

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
  let effectiveEmail = email;
  if ((!effectiveEmail || effectiveEmail.trim() === '') && phone) {
    effectiveEmail = `${phone}@phone.diaplus.vn`;
  }

  if (effectiveEmail) {
    const existingEmail = await db('users').where({ email: effectiveEmail }).first();
    if (existingEmail) throw { status: 409, message: 'Email hoặc số điện thoại này đã được đăng ký' };
  }

  if (phone) {
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) throw { status: 409, message: 'Số điện thoại này đã được đăng ký' };
  }

  const password_hash = await bcrypt.hash(password, 10);
  let user_code;
  do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());

  const insertData = { email: effectiveEmail, password_hash, user_code };
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

const axios = require('axios');

async function googleLogin(accessToken) {
  try {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const email = data.email;
    const name = data.name || email.split('@')[0];
    
    if (!email) throw { status: 400, message: 'Không thể lấy email từ Google' };

    let user = await db('users').where({ email }).first();
    if (!user) {
      let user_code;
      do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());
      
      const [insertedRow] = await db('users').insert({
        email,
        name,
        password_hash: '$2b$10$dummyHashGoogleMockUserNotUsed',
        user_code,
      }).returning('id');
      const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
      user = await db('users').where({ id }).first();
    }

    const token = signToken(user);
    return { token, user: { id: user.id, user_code: user.user_code, name: user.name, address: user.address, email: user.email, phone: user.phone, diagnosis: user.diagnosis, plan: user.plan } };
  } catch (err) {
    console.error('Google verification error:', err);
    throw { status: 401, message: 'Xác thực Google thất bại' };
  }
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
  // Token demo hết hạn SỚM HƠN thời điểm cleanupExpiredDemos() xoá tài khoản (30 phút,
  // xem backend/src/utils/cleanupDemo.js) - tránh trường hợp người dùng vẫn cầm JWT
  // "hợp lệ" (theo JWT_EXPIRES_IN 7 ngày mặc định) trong khi tài khoản đã bị xoá thật,
  // gây lỗi 404/401 khó hiểu giữa phiên demo.
  const token = signToken(user, '25m');
  return {
    token,
    user: { 
      id: user.id, user_code: user.user_code, name: user.name, 
      email: user.email, phone: user.phone, diagnosis: user.diagnosis, 
      plan: user.plan, is_demo: true, created_at: user.created_at 
    },
  };
}

async function acknowledgeSession(decodedUser) {
  const user = await db('users').where({ id: decodedUser.id }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  // Issue a new token with the LATEST token_version from the DB so they won't get conflict again
  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id, user_code: user.user_code, name: user.name,
      email: user.email, phone: user.phone, diagnosis: user.diagnosis,
      plan: user.plan, created_at: user.created_at
    }
  };
}

module.exports = { login, register, getMe, googleLogin, demoLogin, acknowledgeSession };
