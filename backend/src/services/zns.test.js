/* Chạy: node src/services/zns.test.js  (không cần framework, không gửi tin thật) */
'use strict';
const assert = require('assert');
const axios = require('axios');
const zns = require('./zns.service');

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
const ENV = { ESMS_API_KEY: 'k', ESMS_SECRET_KEY: 's', ESMS_ZALO_OAID: 'oa1', ZNS_TEMPLATE_DOSE_REMINDER: '123' };

(async () => {
  console.log('zns.service');
  const calls = [];
  axios.post = async (url, body) => { calls.push({ url, body }); return { data: { CodeResult: '100' } }; };

  await it('chưa cấu hình -> không gửi, không throw', async () => {
    const r = await zns.sendZns({ template: 'doseReminder', phone: '0912345678', data: {}, requestId: 'x' });
    assert.deepStrictEqual(r, { sent: false, reason: 'not_configured' });
    assert.strictEqual(calls.length, 0);
  });

  await it('đã cấu hình -> gửi đúng mẫu, SĐT 84..., RequestId', async () => {
    Object.assign(process.env, ENV);
    const r = await zns.sendZns({ template: 'doseReminder', phone: '0912 345 678', data: { buoi: 'Sáng' }, requestId: 'dose1' });
    assert.strictEqual(r.sent, true);
    assert.strictEqual(calls[0].body.Phone, '84912345678');
    assert.strictEqual(calls[0].body.TempID, '123');
    assert.strictEqual(calls[0].body.RequestId, 'dose1');
    assert.deepStrictEqual(calls[0].body.TempData, { buoi: 'Sáng' });
  });

  await it('mẫu người nhà chưa có mã mẫu -> tắt riêng mẫu đó', async () => {
    assert.strictEqual(zns.isConfigured('caregiverMissed'), false);
  });

  await it('eSMS từ chối / lỗi mạng -> trả sent:false, không throw', async () => {
    axios.post = async () => ({ data: { CodeResult: '789', ErrorMessage: 'TemplateId is not config' } });
    assert.deepStrictEqual(await zns.sendZns({ template: 'doseReminder', phone: '0912345678', data: {}, requestId: 'y' }), { sent: false, reason: 'rejected' });
    axios.post = async () => { throw new Error('timeout'); };
    assert.deepStrictEqual(await zns.sendZns({ template: 'doseReminder', phone: '0912345678', data: {}, requestId: 'z' }), { sent: false, reason: 'send_failed' });
  });

  await it('giờ cữ theo giờ VN: 00:00Z = 07:00 Sáng, 12:30Z = 19:30 Tối', () => {
    assert.deepStrictEqual(zns.doseTimeParams(new Date('2026-10-07T00:00:00Z')), { buoi: 'Sáng', gio: '07:00', ngay: '07/10/2026' });
    assert.strictEqual(zns.doseTimeParams(new Date('2026-10-07T12:30:00Z')).buoi, 'Tối');
  });

  console.log(`\n${pass} passed`);
})();
