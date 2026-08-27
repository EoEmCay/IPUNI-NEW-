/**
 * Tầng đệm cache cho request GET: TTL cache + gộp request trùng đang bay (in-flight dedupe).
 * Giảm mạnh số lần đọc DB mà KHÔNG đổi logic hiện có — service chỉ cần bọc GET qua cachedGet().
 */
const store = new Map(); // key -> { at, res }
const inflight = new Map(); // key -> Promise

const keyOf = (url, params) => url + '?' + JSON.stringify(params || {});

export function cachedGet(api, url, config = {}, ttlMs = 30_000) {
  const key = keyOf(url, config.params);
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.res);
  if (inflight.has(key)) return inflight.get(key);

  const p = api
    .get(url, config)
    .then((res) => {
      store.set(key, { at: Date.now(), res });
      return res;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Gọi sau mỗi mutation để buộc lần đọc kế tiếp lấy dữ liệu mới. */
export function invalidate(prefix) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

/** Xoá toàn bộ cache (vd sau khi logout / đổi user). */
export function clearHttpCache() {
  store.clear();
  inflight.clear();
}
