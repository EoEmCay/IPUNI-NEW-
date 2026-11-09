import localforage from 'localforage';

export const CACHE_KEYS = {
  TODAY_MEDICATIONS: 'dia_cached_today_medications_v1',
  ALL_MEDICATIONS: 'dia_cached_all_medications_v1',
  CARE_TIMELINE: 'dia_cached_care_timeline_v1',
  CARE_WEEKLY: 'dia_cached_care_weekly_v1',
  LATEST_METRICS: 'dia_cached_latest_metrics_v1',
  METRICS_LIST: 'dia_cached_metrics_list_v1',
};

// Khởi tạo instance localforage biệt lập cho offline cache
const offlineStore = localforage.createInstance({
  name: 'DiaPlusApp',
  storeName: 'dia_offline_cache',
  description: 'Bộ nhớ đệm Offline-First cho thuốc hôm nay, timeline và chỉ số sức khỏe',
});

const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Đọc đồng bộ từ localStorage để UI render tức thì trong 0.00 giây (không chờ Promise).
 */
export function getSyncCache(key, fallback = null) {
  if (!hasLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed.data !== undefined ? parsed.data : parsed;
  } catch {
    return fallback;
  }
}

/**
 * Lưu đồng bộ vào localStorage làm snapshot khởi động tức thì.
 */
export function setSyncCache(key, data) {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* ignore storage quota issues */
  }
}

/**
 * Đọc bất đồng bộ từ localforage (IndexedDB), fallback sang localStorage.
 */
export async function getLocalCache(key, fallback = null) {
  try {
    const item = await offlineStore.getItem(key);
    if (item === null || item === undefined) {
      return getSyncCache(key, fallback);
    }
    return item.data !== undefined ? item.data : item;
  } catch (err) {
    return getSyncCache(key, fallback);
  }
}

/**
 * Lưu vào localforage (IndexedDB) và cập nhật đồng thời snapshot localStorage.
 */
export async function setLocalCache(key, data) {
  setSyncCache(key, data);
  try {
    await offlineStore.setItem(key, { data, savedAt: Date.now() });
  } catch {
    /* ignore IndexedDB write issues */
  }
}

/**
 * Xoá một khoá cache.
 */
export async function removeLocalCache(key) {
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    await offlineStore.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Xoá toàn bộ cache offline khi đăng xuất hoặc đổi người dùng.
 */
export async function clearAllLocalCache() {
  if (hasLocalStorage()) {
    try {
      Object.values(CACHE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
  try {
    await offlineStore.clear();
  } catch {
    /* ignore */
  }
}
