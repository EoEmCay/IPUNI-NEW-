/* Chạy: node src/modules/auth/facebookLogin.test.js  (không gọi Facebook thật) */
'use strict';
process.env.FACEBOOK_APP_ID = '111';
process.env.FACEBOOK_APP_SECRET = 'secret';
const assert = require('assert');
const axios = require('axios');
const { facebookLogin } = require('./auth.service');

// Giả lập Graph API: debug_token trả thông tin theo từng token thử
const debug = {
  tok_other_app: { is_valid: true, app_id: '999', user_id: '42' },
  tok_expired: { is_valid: false, app_id: '111', user_id: '42' },
  tok_mismatch: { is_valid: true, app_id: '111', user_id: '42' },
};
axios.get = async (url, opts) => {
  const t = opts?.params?.input_token || opts?.params?.access_token;
  if (url.includes('debug_token')) {
    if (debug[t]) return { data: { data: debug[t] } };
    throw Object.assign(new Error('400'), { response: { status: 400 } });
  }
  if (url.endsWith('/me')) return { data: { id: '77', name: 'Kẻ giả', email: 'victim@gmail.com' } }; // khác user_id 42
  throw new Error('unexpected ' + url);
};

const rejects = async (name, arg, status) => {
  try {
    await facebookLogin(arg);
    console.error('  ✗', name, '- đăng nhập được!'); process.exitCode = 1;
  } catch (e) {
    assert.strictEqual(e.status, status, `${name}: status ${e.status}`);
    console.log('  ✓', name);
  }
};

(async () => {
  console.log('facebookLogin');
  await rejects('token cấp cho ứng dụng khác bị từ chối', 'tok_other_app', 401);
  await rejects('token hết hạn / không hợp lệ bị từ chối', 'tok_expired', 401);
  await rejects('token rác bị từ chối', 'victim@gmail.com', 401);
  await rejects('ID người dùng không khớp bị từ chối', 'tok_mismatch', 401);
  await rejects('thiếu token bị từ chối', undefined, 401);
  process.exit();
})();
