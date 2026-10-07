// Bản web: máy đang chạy bản cũ (app thêm ra màn hình chính chỉ "ngủ" rồi thức, không tải lại;
// hoặc còn service worker cũ) -> khi mở/quay lại app mà server đã có bản deploy mới thì tải lại.
// Chỉ kiểm tra lúc mở/quay lại app (không tải lại giữa chừng khi đang nhập), mỗi bản mới tối đa 1 lần.
const RELOADED_KEY = 'diaplus_reloaded_for';
const runningBundle = () => document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src');

export function initAutoUpdate() {
  if (import.meta.env.DEV || window.Capacitor?.isNativePlatform?.()) return;
  const mine = runningBundle();
  if (!mine) return;
  // Dọn service worker cũ nếu còn (app từng dùng vite-plugin-pwa)
  navigator.serviceWorker?.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});

  let lastCheck = 0;
  const check = async () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 60_000) return;
    lastCheck = Date.now();
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text();
      const latest = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
      if (!latest || latest === mine || sessionStorage.getItem(RELOADED_KEY) === latest) return;
      sessionStorage.setItem(RELOADED_KEY, latest);
      window.location.reload();
    } catch { /* mất mạng: thử lại lần sau */ }
  };
  check();
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', (e) => e.persisted && check()); // iOS/Safari quay lại từ bộ nhớ đệm trang
}
