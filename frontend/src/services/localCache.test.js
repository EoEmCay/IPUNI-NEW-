import assert from 'node:assert/strict';
import {
  CACHE_KEYS,
  getSyncCache,
  setSyncCache,
  getLocalCache,
  setLocalCache,
  removeLocalCache,
  clearAllLocalCache,
} from './localCache.js';

// Polyfill window.localStorage in node for testing
if (typeof globalThis.window === 'undefined') {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  };
}

async function runTests() {
  console.log('Testing localCache service...');

  // 1. Fallback khi chưa có key
  const missing = getSyncCache('unknown_key', 'fallback_val');
  assert.equal(missing, 'fallback_val', 'Phải trả về fallback khi chưa có cache');

  // 2. Lưu và đọc dữ liệu đồng bộ
  const sampleMeds = [
    { id: 1, name: 'Metformin 500mg', dosage: '1 viên', slot: 'morning' },
    { id: 2, name: 'Gliclazide 30mg', dosage: '1 viên', slot: 'morning' },
  ];
  setSyncCache(CACHE_KEYS.TODAY_MEDICATIONS, sampleMeds);
  const readBack = getSyncCache(CACHE_KEYS.TODAY_MEDICATIONS);
  assert.deepEqual(readBack, sampleMeds, 'Dữ liệu đọc ra phải khớp chính xác với dữ liệu đã lưu');

  // 3. getLocalCache đọc được dữ liệu đã lưu
  const asyncRead = await getLocalCache(CACHE_KEYS.TODAY_MEDICATIONS);
  assert.deepEqual(asyncRead, sampleMeds, 'getLocalCache phải trả về dữ liệu snapshot');

  // 4. setLocalCache và getLocalCache
  const sampleTimeline = {
    date: '2026-11-09',
    overall_status: 'stable',
    items: [{ id: 'med_1', time: '07:00', title: 'Metformin' }],
  };
  await setLocalCache(CACHE_KEYS.CARE_TIMELINE, sampleTimeline);
  const timelineRead = await getLocalCache(CACHE_KEYS.CARE_TIMELINE);
  assert.deepEqual(timelineRead, sampleTimeline, 'Timeline cache phải đồng bộ');

  // 5. removeLocalCache
  await removeLocalCache(CACHE_KEYS.CARE_TIMELINE);
  const afterRemove = getSyncCache(CACHE_KEYS.CARE_TIMELINE, null);
  assert.equal(afterRemove, null, 'Cache phải bị xoá sau removeLocalCache');

  // 6. clearAllLocalCache
  await setLocalCache(CACHE_KEYS.ALL_MEDICATIONS, [{ id: 1 }]);
  await setLocalCache(CACHE_KEYS.LATEST_METRICS, { glucose: 6.2 });
  await clearAllLocalCache();
  assert.equal(getSyncCache(CACHE_KEYS.ALL_MEDICATIONS, null), null);
  assert.equal(getSyncCache(CACHE_KEYS.LATEST_METRICS, null), null);

  console.log('✓ localCache tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
