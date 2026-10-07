/* Chạy: node src/modules/scan/scanPresets.test.js
   Mỗi đơn mẫu, sau khi nén lại như app (1600px, JPEG 80%), phải khớp ĐÚNG đơn của nó;
   ảnh lạ (đơn mẫu lật ngang, ảnh trắng) phải không khớp -> chạy AI như thường. */
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const { findPreset } = require('./scanPresets');
const PRESETS = require('./scanPresets.json');

const ROOT = path.join(__dirname, '..', '..', '..', 'test_prescriptions');
const asUploaded = async (img) => {
  const c = img.clone();
  if (c.bitmap.width > 1600) c.resize({ w: 1600 });
  return c.getBuffer('image/jpeg', { quality: 80 });
};

(async () => {
  let slowest = 0;
  for (const p of PRESETS) {
    const img = await Jimp.read(fs.readFileSync(path.join(ROOT, p.label)));
    const t = Date.now();
    const hit = await findPreset(await asUploaded(img));
    slowest = Math.max(slowest, Date.now() - t);
    assert.ok(hit, `${p.label}: phải khớp`);
    assert.strictEqual(hit.label, p.label, `${p.label}: khớp nhầm sang ${hit.label}`);
    assert.strictEqual(await findPreset(await asUploaded(img.clone().flip({ horizontal: true }))), null, `${p.label} lật ngang: không được khớp`);
  }
  const blank = new Jimp({ width: 800, height: 1000, color: 0xffffffff });
  assert.strictEqual(await findPreset(await blank.getBuffer('image/jpeg')), null, 'ảnh trắng: không được khớp');
  console.log(`scanPresets.test.js OK - ${PRESETS.length} đơn mẫu, đối chiếu chậm nhất ${slowest}ms`);
})().catch((e) => { console.error(e.message); process.exit(1); });
