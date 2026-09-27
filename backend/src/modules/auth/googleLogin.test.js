/* Chạy: node src/modules/auth/googleLogin.test.js  (không cần framework, không gọi Google thật) */
'use strict';
const assert = require('assert');
const axios = require('axios');
const { GOOGLE_CLIENT_ID } = require('../../config/constants');
const { googleLogin } = require('./auth.service');

// Giả lập tokeninfo của Google: chỉ token 'tok_*' là hợp lệ, trả về payload tương ứng
const tokens = {
  tok_other_app: { aud: 'someone-else.apps.googleusercontent.com', email: 'victim@gmail.com', email_verified: 'true' },
  tok_unverified: { aud: GOOGLE_CLIENT_ID, email: 'victim@gmail.com', email_verified: 'false' },
};
axios.get = async (url, opts) => {
  const t = opts?.params?.access_token;
  if (url.includes('tokeninfo') && tokens[t]) return { data: tokens[t] };
  throw Object.assign(new Error('400 invalid_token'), { response: { status: 400 } });
};

const rejects401 = async (name, arg) => {
  try {
    await googleLogin(arg);
    console.error('  ✗', name, '\n      đăng nhập được - lỗ hổng!');
    process.exitCode = 1;
  } catch (e) {
    assert.strictEqual(e.status, 401);
    console.log('  ✓', name);
  }
};

(async () => {
  console.log('googleLogin');
  await rejects401('email trần không đăng nhập được', 'victim@gmail.com');
  await rejects401('tiền tố mock_/google_ không đăng nhập được', 'mock_victim@gmail.com');
  await rejects401('token cấp cho app khác bị từ chối', 'tok_other_app');
  await rejects401('email chưa xác minh bị từ chối', 'tok_unverified');
  await rejects401('thiếu token bị từ chối', undefined);
  process.exit();
})();
