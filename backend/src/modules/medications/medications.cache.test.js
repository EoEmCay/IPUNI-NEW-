/* Chạy: node src/modules/medications/medications.cache.test.js  (không cần framework, không cần DB thật) */
'use strict';
const assert = require('assert');
const Module = require('module');
const path = require('path');

// ───────── DB giả trong bộ nhớ, đếm số lần đọc và cho phép làm chậm lần đọc ─────────
const rows = []; // bảng medications
let reads = 0;
let readGate = null; // nếu là Promise: lần đọc kế tiếp sẽ chờ nó (mô phỏng truy vấn chậm)
let nextId = 1;

function table() {
  const f = { where: {}, order: false };
  const b = {
    where(w) { f.where = { ...f.where, ...w }; return b; },
    orderBy() { f.order = true; return b; },
    async _select() {
      const snapshot = rows.filter((r) => Object.entries(f.where).every(([k, v]) => String(r[k]) === String(v))).map((r) => ({ ...r }));
      reads++;
      if (readGate) { const g = readGate; readGate = null; await g; }
      return snapshot;
    },
    then(res, rej) { return b._select().then(res, rej); },
    async first() { const r = await b._select(); return r[0]; },
    insert(p) { b._insert = p; return b; },
    async returning() { const r = { id: nextId++, ...b._insert }; rows.push(r); return [{ id: r.id }]; },
    async update(p) { rows.filter((r) => Object.entries(f.where).every(([k, v]) => String(r[k]) === String(v))).forEach((r) => Object.assign(r, p)); },
    async delete() { for (let i = rows.length - 1; i >= 0; i--) if (Object.entries(f.where).every(([k, v]) => String(rows[i][k]) === String(v))) rows.splice(i, 1); },
  };
  return b;
}

const origLoad = Module._load;
Module._load = function (req, parent, ...rest) {
  if (req === '../../config/database') return () => table();
  return origLoad.call(this, req, parent, ...rest);
};
const svc = require('./medications.service');
const memoryCache = require('../../utils/memoryCache');
Module._load = origLoad;

let pass = 0;
const it = async (name, fn) => {
  try { memoryCache.clear(); rows.length = 0; reads = 0; readGate = null; await fn(); pass++; console.log('  ✓', name); }
  catch (e) { console.error('  ✗', name, '\n     ', e.message); process.exitCode = 1; }
};

(async () => {
  console.log('medications cache');

  await it('lần 2 lấy từ cache, không đọc DB nữa', async () => {
    rows.push({ id: 1, user_id: 1, name: 'Metformin', times: '["08:00"]', is_active: 1 });
    await svc.getMedications(1);
    await svc.getMedications(1);
    assert.strictEqual(reads, 1);
  });

  await it('sửa object trả về không làm bẩn cache', async () => {
    rows.push({ id: 1, user_id: 1, name: 'Metformin', times: '["08:00"]', is_active: 1 });
    const a = await svc.getMedications(1);
    a[0].name = 'HACKED'; a.push({ x: 1 });
    const b = await svc.getMedications(1);
    assert.strictEqual(b.length, 1);
    assert.strictEqual(b[0].name, 'Metformin');
  });

  await it('cập nhật thuốc -> lần đọc sau thấy dữ liệu mới ngay', async () => {
    rows.push({ id: 1, user_id: 1, name: 'Metformin', dosage: '500mg', times: '["08:00"]', is_active: 1 });
    assert.strictEqual((await svc.getTodayMedications(1))[0].dosage, '500mg');
    await svc.updateMedication(1, 1, { dosage: '850mg' });
    assert.strictEqual((await svc.getTodayMedications(1))[0].dosage, '850mg');
  });

  await it('thêm / xoá thuốc cũng làm mới cache', async () => {
    assert.strictEqual((await svc.getMedications(1)).length, 0);
    const m = await svc.createMedication(1, { name: 'Insulin', dosage: '10UI', frequency: '1 lần/ngày', times: ['07:00'], is_active: 1 /* DB thật có default 1 */ });
    assert.strictEqual((await svc.getMedications(1)).length, 1);
    await svc.deleteMedication(1, m.id);
    assert.strictEqual((await svc.getMedications(1)).length, 0);
  });

  await it('ghi lỗi (404) vẫn xoá cache, không để lại bản cũ', async () => {
    rows.push({ id: 1, user_id: 1, name: 'A', times: '[]', is_active: 1 });
    await svc.getMedications(1);
    await assert.rejects(() => svc.updateMedication(1, 999, { dosage: 'x' }), (e) => e.status === 404);
    assert.strictEqual(memoryCache.get('meds:all:1'), null);
  });

  await it('RACE: GET đang đọc dở thì có ghi -> KHÔNG cache kết quả cũ', async () => {
    rows.push({ id: 1, user_id: 1, name: 'Metformin', dosage: '500mg', times: '["08:00"]', is_active: 1 });
    let release;
    readGate = new Promise((r) => { release = r; });
    const slowGet = svc.getMedications(1);          // đọc DB (dữ liệu cũ: 500mg) rồi bị giữ lại
    await new Promise((r) => setImmediate(r));
    await svc.updateMedication(1, 1, { dosage: '850mg' }); // ghi xong + xoá cache trong lúc GET còn treo
    release();
    const stale = await slowGet;                       // request đó nhận bản cũ là chấp nhận được
    assert.strictEqual(stale[0].dosage, '500mg');
    const fresh = await svc.getMedications(1);         // nhưng request sau PHẢI thấy bản mới
    assert.strictEqual(fresh[0].dosage, '850mg');
  });

  await it('ghi của user 1 không xoá cache của user 10 (không trùng tiền tố)', async () => {
    rows.push({ id: 1, user_id: 10, name: 'B', times: '[]', is_active: 1 });
    rows.push({ id: 2, user_id: 1, name: 'A', times: '[]', is_active: 1 });
    await svc.getMedications(10);
    await svc.updateMedication(1, 2, { dosage: 'x' });
    assert.ok(memoryCache.get('meds:all:10'), 'cache user 10 phải còn nguyên');
  });

  await it('memoryCache: ghi đè key đã có khi đầy không đuổi key khác', async () => {
    const { constructor: MemoryCache } = Object.getPrototypeOf(memoryCache);
    const c = new MemoryCache(2);
    c.set('a', 1); c.set('b', 2); c.set('b', 3);
    assert.strictEqual(c.get('a'), 1);
    assert.strictEqual(c.get('b'), 3);
  });

  console.log(`\n${pass} passed`);
})();
