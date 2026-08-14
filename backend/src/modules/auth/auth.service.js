const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/constants');
const loginRequestStore = require('./loginRequest.store');

// Coi tài khoản là "đang có thiết bị hoạt động" nếu last_active_at (được auth.middleware
// cập nhật mỗi khi có request kèm token hợp lệ) còn nằm trong khoảng thời gian này.
// Lớn hơn chu kỳ heartbeat của middleware (20s) để tránh vừa hết hạn heartbeat đã coi là "offline".
const ACTIVE_SESSION_THRESHOLD_MS = 45 * 1000;

function sendNewDeviceEmail(user) {
  const is_demo = user.email && user.email.startsWith('demo_');
  const GMAIL_USER = process.env.GMAIL_USER || process.env.MAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAIL_PASS;
  if (!GMAIL_USER || !GMAIL_PASS || !user.email || is_demo) return;

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  const loginTime = new Date().toLocaleString('vi-VN');

  // Cùng nguyên nhân deliverability như email OTP: HTML nặng + ảnh ngoài + không có bản
  // text/plain khiến Gmail âm thầm hủy thư (không vào cả Spam) khi test thật trên
  // production. Đơn giản hóa để cảnh báo bảo mật này thực sự tới được người dùng.
  transporter.sendMail({
    from: `"DIA+" <${GMAIL_USER}>`,
    to: user.email,
    subject: 'Cảnh báo: Đăng nhập thiết bị mới trên DIA+',
    text: `Xin chào ${user.name || 'Người dùng DIA+'},\n\nTài khoản DIA+ của bạn vừa được đăng nhập thành công vào lúc: ${loginTime}\nTài khoản: ${user.email}\n\nNếu không phải là bạn, hãy truy cập diaplus.vn và đổi mật khẩu ngay lập tức.\n\n— DIA+ (diaplus.vn)`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto;">
          <tr>
            <td style="padding-bottom: 16px;">
              <span style="font-size: 18px; font-weight: 700; color: #1B5FA6;">DIA+</span>
            </td>
          </tr>
          <tr>
            <td style="font-size: 15px; font-weight: 700; padding-bottom: 12px;">
              Cảnh báo: đăng nhập thiết bị mới
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; line-height: 1.6; color: #334155; padding-bottom: 12px;">
              Xin chào <strong>${user.name || 'Người dùng DIA+'}</strong>, tài khoản DIA+ của bạn vừa được đăng nhập thành công vào lúc <strong>${loginTime}</strong> (tài khoản: ${user.email}).
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #991B1B; line-height: 1.6; padding-bottom: 16px;">
              Nếu không phải là bạn, hãy truy cập <a href="https://diaplus.vn" style="color: #DC2626; font-weight: 700;">diaplus.vn</a> và đổi mật khẩu ngay lập tức.
            </td>
          </tr>
          <tr>
            <td style="font-size: 12px; color: #94A3B8; padding-top: 16px; border-top: 1px solid #E2E8F0;">
              — <a href="https://diaplus.vn" style="color: #1B5FA6;">diaplus.vn</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }).catch(err => console.error('Lỗi gửi email đăng nhập:', err.message));
}

function sanitizeUser(user) {
  const is_demo = user.email && user.email.startsWith('demo_');
  return {
    id: user.id, user_code: user.user_code, name: user.name,
    address: user.address, email: user.email, phone: user.phone,
    diagnosis: user.diagnosis, plan: user.plan,
    is_demo, created_at: is_demo ? user.created_at : undefined
  };
}

// Cấp token mới cho user (bump token_version để các phiên cũ - nếu có - bị coi là hết hạn
// ở lần request kế tiếp), gửi email cảnh báo, và trả về payload chuẩn cho client.
async function issueLoginToken(user) {
  const newTokenVersion = (user.token_version || 1) + 1;
  await db('users').where({ id: user.id }).update({ token_version: newTokenVersion });
  user.token_version = newTokenVersion;

  const token = signToken(user);
  sendNewDeviceEmail(user);

  return { token, user: sanitizeUser(user) };
}

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

  const is_demo = user.email && user.email.startsWith('demo_');
  const hasActiveDevice = !is_demo && user.last_active_at &&
    (Date.now() - new Date(user.last_active_at).getTime() < ACTIVE_SESSION_THRESHOLD_MS);

  if (hasActiveDevice) {
    const requestId = loginRequestStore.create(user.id, identifier);
    return { status: 'pending', requestId };
  }

  return issueLoginToken(user);
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

    // Đi qua cùng cơ chế duyệt 2-thiết-bị như đăng nhập thường (login()) - trước đây
    // googleLogin ký token thẳng, bỏ qua hoàn toàn bước này.
    const is_demo = user.email && user.email.startsWith('demo_');
    const hasActiveDevice = !is_demo && user.last_active_at &&
      (Date.now() - new Date(user.last_active_at).getTime() < ACTIVE_SESSION_THRESHOLD_MS);

    if (hasActiveDevice) {
      const requestId = loginRequestStore.create(user.id, email);
      return { status: 'pending', requestId };
    }

    return issueLoginToken(user);
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

async function getLoginStatus(requestId) {
  const entry = loginRequestStore.get(requestId);
  if (!entry) throw { status: 404, message: 'Yêu cầu đăng nhập không tồn tại hoặc đã hết hạn' };

  if (entry.status === 'approved') {
    return { status: 'approved', token: entry.token, user: entry.user };
  }
  return { status: entry.status };
}

async function getPendingApprovals(userId) {
  return loginRequestStore.listPendingForUser(userId).map(entry => ({
    requestId: entry.requestId,
    identifier: entry.identifier,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
  }));
}

async function approveLogin(requestId, approverId) {
  const entry = loginRequestStore.get(requestId);
  if (!entry) throw { status: 404, message: 'Yêu cầu đăng nhập không tồn tại hoặc đã hết hạn' };
  if (entry.userId !== approverId) throw { status: 403, message: 'Bạn không có quyền xử lý yêu cầu này' };
  if (entry.status !== 'pending') throw { status: 409, message: 'Yêu cầu này đã được xử lý' };

  const user = await db('users').where({ id: entry.userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  const { token, user: sanitized } = await issueLoginToken(user);
  loginRequestStore.approve(requestId, token, sanitized);
  return { success: true };
}

async function rejectLogin(requestId, approverId) {
  const entry = loginRequestStore.get(requestId);
  if (!entry) throw { status: 404, message: 'Yêu cầu đăng nhập không tồn tại hoặc đã hết hạn' };
  if (entry.userId !== approverId) throw { status: 403, message: 'Bạn không có quyền xử lý yêu cầu này' };
  if (entry.status !== 'pending') throw { status: 409, message: 'Yêu cầu này đã được xử lý' };

  loginRequestStore.reject(requestId);
  return { success: true };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw { status: 404, message: 'Người dùng không tồn tại' };

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw { status: 401, message: 'Mật khẩu hiện tại không đúng' };

  const password_hash = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: userId }).update({ password_hash });
  user.password_hash = password_hash;

  // Đổi mật khẩu xong thì cấp token mới cho chính thiết bị này, đồng thời bump token_version
  // để mọi phiên khác (kể cả kẻ đã bị từ chối đăng nhập) đều hết hiệu lực ngay lập tức.
  return issueLoginToken(user);
}

module.exports = {
  login, register, getMe, googleLogin, demoLogin, acknowledgeSession,
  getLoginStatus, getPendingApprovals, approveLogin, rejectLogin, changePassword,
};
