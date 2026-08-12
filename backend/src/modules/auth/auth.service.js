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

  transporter.sendMail({
    from: `"DIA+ Security Alert" <${GMAIL_USER}>`,
    to: user.email,
    subject: '⚠️ Cảnh báo: Đăng nhập thiết bị mới trên DIA+',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
                <!-- Header Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1B5FA6 0%, #0F3C6E 100%); padding: 28px 24px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 1px;">
                      DIA<span style="color: #60A5FA;">+</span> Security
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 4px 0 0;">
                      Cảnh Báo Đăng Nhập Thiết Bị Mới
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 28px 24px;">
                    <h2 style="color: #111827; font-size: 18px; font-weight: 700; margin: 0 0 12px; text-align: center;">Phát Hiện Phiên Đăng Nhập Mới</h2>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                      Xin chào <strong>${user.name || 'Người dùng DIA+'}</strong>,
                    </p>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
                      Tài khoản DIA+ của bạn vừa được đăng nhập thành công vào lúc:
                    </p>

                    <!-- Info Box -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 0 0 20px;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #64748B;">
                        🕒 <strong>Thời gian:</strong> <span style="color: #1E293B; font-weight: 600;">${new Date().toLocaleString('vi-VN')}</span>
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #64748B;">
                        ✉️ <strong>Tài khoản:</strong> <span style="color: #1E293B; font-weight: 600;">${user.email}</span>
                      </p>
                    </div>

                    <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                      <p style="color: #991B1B; font-size: 13px; margin: 0; line-height: 1.4;">
                        🚨 <strong>Nếu không phải là bạn:</strong> Hãy đăng nhập ngay vào ứng dụng DIA+ và đổi mật khẩu lập tức để vô hiệu hóa tất cả thiết bị khác.
                      </p>
                    </div>

                    <p style="color: #9CA3AF; font-size: 12px; margin: 0; text-align: center;">
                      Nếu đây là thao tác của bạn, hãy bỏ qua email này.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #F9FAFB; padding: 16px 24px; text-align: center; border-top: 1px solid #F3F4F6;">
                    <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                      © 2026 <strong>DIA+ Health System</strong> · <a href="https://diaplus.vn" style="color: #1B5FA6; text-decoration: none;">diaplus.vn</a>
                    </p>
                  </td>
                </tr>
              </table>
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
