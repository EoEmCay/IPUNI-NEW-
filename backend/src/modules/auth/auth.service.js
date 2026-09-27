const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = require('../../config/constants');
const loginRequestStore = require('./loginRequest.store');
const { getTransporter, getFromAddress } = require('../../utils/mailer');

// Coi tài khoản là "đang có thiết bị hoạt động" nếu last_active_at (được auth.middleware
// cập nhật mỗi khi có request kèm token hợp lệ) còn nằm trong khoảng thời gian này.
// Lớn hơn chu kỳ heartbeat của middleware (20s) để tránh vừa hết hạn heartbeat đã coi là "offline".
const ACTIVE_SESSION_THRESHOLD_MS = 45 * 1000;

function sendNewDeviceEmail(user) {
  const is_demo = user.email && user.email.startsWith('demo_');
  if (!user.email || is_demo) return;
  const transporter = getTransporter();
  if (!transporter) return;

  const loginTime = new Date().toLocaleString('vi-VN');

  // Cùng nguyên nhân deliverability như email OTP: HTML nặng + ảnh ngoài + không có bản
  // text/plain khiến Gmail âm thầm hủy thư (không vào cả Spam) khi test thật trên
  // production. Đơn giản hóa để cảnh báo bảo mật này thực sự tới được người dùng.
  transporter.sendMail({
    from: getFromAddress(),
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

function sendPasswordChangedEmail(user) {
  const is_demo = user.email && user.email.startsWith('demo_');
  if (!user.email || is_demo) return;
  const transporter = getTransporter();
  if (!transporter) return;
  const changeTime = new Date().toLocaleString('vi-VN');

  transporter.sendMail({
    from: getFromAddress(),
    to: user.email,
    subject: 'Mật khẩu DIA+ của bạn vừa được thay đổi',
    text: `Xin chào ${user.name || 'Người dùng DIA+'},\n\nMật khẩu tài khoản DIA+ của bạn vừa được đặt lại vào lúc: ${changeTime}\nTài khoản: ${user.email}\n\nTất cả các thiết bị đang đăng nhập trước đó đã bị đăng xuất.\n\nNếu không phải là bạn, hãy truy cập diaplus.vn và liên hệ hỗ trợ ngay lập tức.\n\n— DIA+ (diaplus.vn)`,
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
              Mật khẩu của bạn vừa được thay đổi
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; line-height: 1.6; color: #334155; padding-bottom: 12px;">
              Xin chào <strong>${user.name || 'Người dùng DIA+'}</strong>, mật khẩu tài khoản DIA+ (${user.email}) của bạn vừa được đặt lại vào lúc <strong>${changeTime}</strong>. Tất cả thiết bị đang đăng nhập trước đó đã bị đăng xuất.
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #991B1B; line-height: 1.6; padding-bottom: 16px;">
              Nếu không phải là bạn, hãy truy cập <a href="https://diaplus.vn" style="color: #DC2626; font-weight: 700;">diaplus.vn</a> và liên hệ hỗ trợ ngay lập tức.
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
  }).catch(err => console.error('Lỗi gửi email thông báo đổi mật khẩu:', err.message));
}

function sanitizeUser(user) {
  const is_demo = user.email && user.email.startsWith('demo_');
  return {
    id: user.id, user_code: user.user_code, name: user.name,
    address: user.address, email: user.email, phone: user.phone,
    cccd: user.cccd,
    role: user.role || 'patient',
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
      role: user.role || 'patient',
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
    .orWhere({ cccd: identifier })
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
    if (typeof accessToken !== 'string' || !accessToken) throw new Error('missing token');

    // Chỉ tin token do Google cấp cho chính client DIA+ với email đã xác minh.
    // (Trước đây chấp nhận thẳng một chuỗi email -> ai biết email là vào được tài khoản.)
    const { data: info } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { access_token: accessToken },
    });
    if (info.aud !== GOOGLE_CLIENT_ID || String(info.email_verified) !== 'true' || !info.email) {
      throw new Error('token not issued for DIA+ or email unverified');
    }

    const email = info.email.toLowerCase();
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const name = profile.name || email.split('@')[0];

    return await loginSocialUser({ email, name });
  } catch (err) {
    console.error('Google verification error:', err);
    throw { status: 401, message: 'Xác thực Google thất bại' };
  }
}

// Tìm (hoặc tạo) người dùng từ đăng nhập mạng xã hội đã xác thực, rồi đi qua cùng cơ chế duyệt
// 2-thiết-bị như đăng nhập mật khẩu. facebookId ưu tiên hơn email (email có thể thiếu/đổi).
async function loginSocialUser({ email, name, facebookId = null }) {
  let user = facebookId ? await db('users').where({ facebook_id: facebookId }).first() : null;
  if (!user && email) {
    user = await db('users').where({ email }).first();
    if (user && facebookId) {
      await db('users').where({ id: user.id }).update({ facebook_id: facebookId });
      user.facebook_id = facebookId;
    }
  }
  if (!user) {
    let user_code;
    do { user_code = genUserCode(); } while (await db('users').where({ user_code }).first());
    const [insertedRow] = await db('users').insert({
      // Cột email bắt buộc: người dùng FB bằng SĐT không có email -> email thay thế (như đăng ký SĐT)
      email: email || `${facebookId}@facebook.diaplus.vn`,
      name,
      password_hash: '$2b$10$dummyHashSocialLoginUserNotUsed',
      user_code,
      ...(facebookId ? { facebook_id: facebookId } : {}),
    }).returning('id');
    const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;
    user = await db('users').where({ id }).first();
  }

  const is_demo = user.email && user.email.startsWith('demo_');
  const hasActiveDevice = !is_demo && user.last_active_at &&
    (Date.now() - new Date(user.last_active_at).getTime() < ACTIVE_SESSION_THRESHOLD_MS);
  if (hasActiveDevice) {
    const requestId = loginRequestStore.create(user.id, user.email);
    return { status: 'pending', requestId };
  }
  return issueLoginToken(user);
}

async function facebookLogin(accessToken) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw { status: 503, message: 'Đăng nhập Facebook chưa được cài đặt' };
  }
  try {
    if (typeof accessToken !== 'string' || !accessToken) throw new Error('missing token');
    // Hỏi Facebook: token có hợp lệ và có đúng là cấp cho ứng dụng DIA+ không
    const { data: dbg } = await axios.get('https://graph.facebook.com/debug_token', {
      params: { input_token: accessToken, access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}` },
    });
    const info = dbg && dbg.data;
    if (!info || !info.is_valid || String(info.app_id) !== String(FACEBOOK_APP_ID) || !info.user_id) {
      throw new Error('token not issued for DIA+');
    }
    const proof = crypto.createHmac('sha256', FACEBOOK_APP_SECRET).update(accessToken).digest('hex');
    const { data: me } = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,email', access_token: accessToken, appsecret_proof: proof },
    });
    if (String(me.id) !== String(info.user_id)) throw new Error('user mismatch');
    // Facebook chỉ trả email đã được người dùng xác nhận
    const email = me.email ? String(me.email).toLowerCase() : null;
    return await loginSocialUser({ email, name: me.name || 'Người dùng Facebook', facebookId: String(me.id) });
  } catch (err) {
    if (err && err.status) throw err;
    console.error('Facebook verification error:', err.message || err);
    throw { status: 401, message: 'Xác thực Facebook thất bại' };
  }
}

async function demoLogin() {
  const suffix = crypto.randomUUID().slice(0, 12).replace(/-/g, '');
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

// Đặt lại mật khẩu qua luồng "Quên mật khẩu" - target đã được xác thực OTP thành công và
// đi kèm resetTicket hợp lệ (kiểm tra ở controller trước khi gọi hàm này), nên không cần
// mật khẩu cũ.
async function resetPassword(target, newPassword) {
  const isPhoneTarget = !target.includes('@');
  const user = await db('users').where(isPhoneTarget ? { phone: target } : { email: target }).first();
  if (!user) throw { status: 404, message: 'Không tìm thấy tài khoản.' };

  const password_hash = await bcrypt.hash(newPassword, 10);
  const newTokenVersion = (user.token_version || 1) + 1;
  // Bump token_version cùng lúc với đổi mật khẩu: mọi phiên cũ (kể cả phiên của kẻ đã
  // chiếm được tài khoản, nếu có) đều bị vô hiệu hoá ngay ở request kế tiếp của họ.
  await db('users').where({ id: user.id }).update({ password_hash, token_version: newTokenVersion });
  user.password_hash = password_hash;
  user.token_version = newTokenVersion;

  sendPasswordChangedEmail(user);

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}

// Xoá dấu vết "thiết bị đang hoạt động" khi đăng xuất chủ động. Nếu không làm việc này,
// login() vẫn thấy last_active_at mới (được auth.middleware cập nhật liên tục trong lúc
// dùng app) trong tối đa 45s sau - đăng nhập lại ngay sau khi đăng xuất (kịch bản rất phổ
// biến khi test hoặc dùng thật) sẽ bị hiểu nhầm thành "có thiết bị khác đang hoạt động" và
// bắt chờ duyệt, dù thực chất chỉ là chính thiết bị đó đăng nhập lại. Người dùng thấy màn
// hình "chờ duyệt" bế tắc (không có thiết bị nào khác để duyệt), tưởng nhầm là mất dữ liệu
// trong khi dữ liệu vẫn còn nguyên trong DB.
async function logout(userId) {
  if (!userId) return;
  await db('users').where({ id: userId }).update({ last_active_at: null }).catch(() => {});
}

module.exports = {
  login, register, getMe, googleLogin, facebookLogin, demoLogin, acknowledgeSession, logout,
  getLoginStatus, getPendingApprovals, approveLogin, rejectLogin, changePassword, resetPassword,
};
