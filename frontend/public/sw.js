// Service worker "tự huỷ". App từng dùng vite-plugin-pwa (đã gỡ ở d5c6a16) -> máy nào từng mở app đời đó
// vẫn còn service worker cũ phục vụ bản lưu sẵn (vd vẫn thấy robot Trợ lý đã bỏ). Khi nó kiểm tra cập nhật
// /sw.js sẽ nhận file này: xoá mọi cache, tự gỡ đăng ký, tải lại các tab -> người dùng thấy bản mới nhất.
// Giữ file này ít nhất vài tháng cho tới khi không còn máy nào mang service worker cũ.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
