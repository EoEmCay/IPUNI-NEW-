/* Chạy: node src/services/telegram.test.js  (không cần framework, không gọi Telegram thật) */
'use strict';
const assert = require('assert');
const axios = require('axios');
const tg = require('./telegram.service');

let pass = 0;
const it = async (name, fn) => {
  try {
    await fn();
    pass++;
    console.log('  ✓', name);
  } catch (e) {
    console.error('  ✗', name, '\n     ', e.message);
    process.exitCode = 1;
  }
};

(async () => {
  console.log('telegram.service');
  const calls = [];
  axios.post = async (url, body) => { calls.push({ url, body }); return { data: { ok: true, result: {} } }; };

  await it('chưa cấu hình -> không gửi', async () => {
    assert.deepStrictEqual(await tg.sendMessage('1', 'hi'), { sent: false, reason: 'not_configured' });
    assert.strictEqual(calls.length, 0);
  });

  process.env.TELEGRAM_BOT_TOKEN = 'T';
  process.env.TELEGRAM_BOT_USERNAME = 'diaplus_bot';

  await it('link kết nối mở được, mã ký đúng thì nhận ra user', () => {
    const url = tg.linkUrl(42);
    assert.match(url, /^https:\/\/t\.me\/diaplus_bot\?start=42_[0-9a-f]{20}$/);
    assert.strictEqual(tg.parseStartToken(url.split('start=')[1]), 42);
  });

  await it('mã giả / sửa user id -> từ chối (không chiếm được tài khoản người khác)', () => {
    const param = tg.linkUrl(42).split('start=')[1];
    assert.strictEqual(tg.parseStartToken(param.replace(/^42_/, '43_')), null);
    assert.strictEqual(tg.parseStartToken('42_' + '0'.repeat(20)), null);
    assert.strictEqual(tg.parseStartToken('abc'), null);
    assert.strictEqual(tg.parseStartToken(undefined), null);
  });

  await it('gửi tin kèm nút "Đã uống"', async () => {
    const r = await tg.sendMessage('99', '<b>x</b>', { buttons: [{ text: '✅ Đã uống', data: 't:123' }] });
    assert.strictEqual(r.sent, true);
    assert.strictEqual(calls[0].url, 'https://api.telegram.org/botT/sendMessage');
    assert.deepStrictEqual(calls[0].body.reply_markup.inline_keyboard, [[{ text: '✅ Đã uống', callback_data: 't:123' }]]);
  });

  await it('Telegram lỗi -> sent:false, không throw', async () => {
    axios.post = async () => { throw new Error('chat not found'); };
    assert.strictEqual((await tg.sendMessage('1', 'x')).sent, false);
  });

  await it('escapeHtml chặn chèn thẻ từ tên thuốc người dùng nhập', () => {
    assert.strictEqual(tg.escapeHtml('<b>A&B</b>'), '&lt;b&gt;A&amp;B&lt;/b&gt;');
  });

  console.log(`\n${pass} passed`);
})();
