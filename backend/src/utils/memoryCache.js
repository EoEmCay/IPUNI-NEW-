'use strict';

/**
 * Bộ nhớ đệm In-Memory siêu nhẹ cho Backend DIA+.
 * - Hỗ trợ TTL (mặc định 10 phút).
 * - Tự động dọn dẹp theo cơ chế LRU khi vượt quá MAX_ENTRIES.
 * - Hỗ trợ xóa theo tiền tố (delPrefix) khi người dùng cập nhật dữ liệu.
 */

const MAX_ENTRIES = 5000;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 phút

class MemoryCache {
  constructor(maxEntries = MAX_ENTRIES) {
    this.maxEntries = maxEntries;
    this.store = new Map(); // key -> { val, expiresAt }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Đưa key lên đầu (LRU update)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.val;
  }

  set(key, val, ttlMs = DEFAULT_TTL_MS) {
    if (this.store.size >= this.maxEntries) {
      // Xóa phần tử cũ nhất (phần tử đầu tiên trong Map iterator)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      val,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  delPrefix(prefix) {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

const memoryCache = new MemoryCache();

module.exports = memoryCache;
