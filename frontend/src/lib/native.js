/**
 * Lớp tương thích Capacitor (native iOS / Android) <-> web.
 * Mọi nơi khác trong app import từ đây, không import trực tiếp @capacitor/* rải rác.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

let lastBackPressTime = 0;
const registeredBackHandlers = [];

/**
 * Đăng ký bộ xử lý nút Back thủ công (dành cho modal hoặc component đặc thù).
 * Trả về hàm huỷ đăng ký.
 */
export function registerBackHandler(fn) {
  registeredBackHandlers.push(fn);
  return () => {
    const idx = registeredBackHandlers.lastIndexOf(fn);
    if (idx !== -1) registeredBackHandlers.splice(idx, 1);
  };
}

/**
 * Hiển thị thông báo Toast chuẩn Android: "Chạm lần nữa để thoát DIA+"
 */
export function showExitToast(message = 'Chạm lần nữa để thoát DIA+') {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('dia-exit-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'dia-exit-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 20px) + 75px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.94);
    color: #ffffff;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 13.5px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 999999;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2000);
}

/**
 * Xử lý thông minh khi bấm nút Back phần cứng của Android hoặc cử chỉ vuốt:
 * 1. Nếu có modal/popup đang mở trong DOM: Ưu tiên đóng modal trước.
 * 2. Nếu ở trang con: Quay lại trang trước (history.back).
 * 3. Nếu ở màn hình gốc (Dashboard, Login): Bấm lần 1 hiện Toast, bấm lần 2 trong 2s mới thoát app.
 */
export async function handleHardwareBack({ canGoBack } = {}) {
  // 1. Kiểm tra handler thủ công đã đăng ký
  for (let i = registeredBackHandlers.length - 1; i >= 0; i--) {
    const handler = registeredBackHandlers[i];
    try {
      const handled = handler();
      if (handled) return;
    } catch {}
  }

  // 2. Phát sự kiện để modal / component lắng nghe và tự đóng
  if (typeof window !== 'undefined') {
    const ev = new CustomEvent('dia:hardware-back', { cancelable: true });
    window.dispatchEvent(ev);
    if (ev.defaultPrevented) return;
  }

  // 3. Tự động phát hiện modal / popup đang mở trong DOM để đóng trước
  if (typeof document !== 'undefined') {
    const activeCloseBtn = document.querySelector(
      '[role="dialog"] button[aria-label="Đóng"], [class*="closeBtn"], [class*="sheetClose"], [aria-label="Đóng"]'
    );
    if (activeCloseBtn && typeof activeCloseBtn.click === 'function') {
      activeCloseBtn.click();
      return;
    }
  }

  // 4. Kiểm tra trang gốc (root pages)
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const isRootPage =
    ['/', '/dashboard', '/login', '/register', '/index.html'].includes(path) ||
    ['', '#/', '#/dashboard', '#/login', '#/register'].includes(hash);

  if (!isRootPage && (canGoBack || (typeof window !== 'undefined' && window.history.length > 1))) {
    if (typeof window !== 'undefined') window.history.back();
    return;
  }

  // 5. Nếu đang ở màn hình gốc: Chạm 2 lần trong 2 giây để thoát app
  const now = Date.now();
  if (now - lastBackPressTime < 2000) {
    if (isNative) {
      const { App } = await import('@capacitor/app');
      App.exitApp();
    } else {
      showExitToast('Đã kích hoạt thoát ứng dụng (Native Exit)');
    }
  } else {
    lastBackPressTime = now;
    showExitToast('Chạm lần nữa để thoát DIA+');
  }
}

/** Khởi tạo các plugin UI khi app chạy native (status bar, splash, nút back, bàn phím). */
export async function initNative() {
  if (!isNative) return;
  try {
    const [{ StatusBar, Style }, { SplashScreen }, { App }, { Keyboard }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
      import('@capacitor/keyboard'),
    ]);

    await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: '#1B5FA6' }).catch(() => {});

    // Ẩn splash sau khi web app đã mount
    setTimeout(() => SplashScreen.hide().catch(() => {}), 200);

    // Xử lý nút Back phần cứng của Android thông minh
    App.addListener('backButton', ({ canGoBack }) => {
      handleHardwareBack({ canGoBack });
    });

    Keyboard.setAccessoryBarVisible?.({ isVisible: true }).catch(() => {});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[native] initNative lỗi:', e?.message);
  }
}

/** Copy text — dùng plugin Clipboard khi native, fallback navigator.clipboard trên web. */
export async function copyText(text) {
  if (isNative) {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: String(text) });
    return true;
  }
  await navigator.clipboard.writeText(String(text));
  return true;
}

/** Plugin Flashlight native để nháy đèn flash LED và rung thiết bị của iPhone / Android */
const FlashAlert = Capacitor.registerPlugin('FlashAlert', {
  web: () => ({
    blink: async () => ({ success: false }),
    vibrate: async () => ({ success: false }),
    isAvailable: async () => ({ available: false }),
  }),
});

/** Kích hoạt rung vật lý trên điện thoại (Haptic feedback / Vibrate) */
export async function vibrateDevice() {
  if (isNative) {
    try {
      await FlashAlert.vibrate();
      return true;
    } catch { /* fallback */ }
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 400]);
      return true;
    } catch { /* ignore */ }
  }
  return false;
}

/** Nháy đèn flash LED camera 4 lần liên tiếp kết hợp rung để báo động uống thuốc */
export async function blinkFlash(count = 4, interval = 0.15) {
  vibrateDevice();
  if (!isNative) return false;
  try {
    const res = await FlashAlert.blink({ count, interval, vibrate: true });
    return res?.success ?? false;
  } catch (e) {
    console.warn('[FlashAlert] Lỗi nháy flash:', e?.message);
    return false;
  }
}

/**
 * Mở Camera chụp ảnh hoặc chọn ảnh từ thư viện native:
 * - Tự động xin cấp quyền thiết bị (Camera / Photo Library)
 * - Tối ưu phần cứng & Nén ảnh trực tiếp (Hardware downscale & compress):
 *   Giảm dung lượng từ 10MB-15MB xuống còn ~400KB-600KB ngay trên thiết bị
 * - Trả về file Blob/File chuẩn, tương thích hoàn toàn với FormData tải lên AI
 */
export async function captureNativePhoto({ fromCamera = true, quality = 80, maxWidth = 1600 } = {}) {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  const check = await Camera.checkPermissions();
  if (check.camera === 'denied' || check.photos === 'denied') {
    const req = await Camera.requestPermissions({
      permissions: fromCamera ? ['camera'] : ['photos'],
    });
    if (req.camera === 'denied' || req.photos === 'denied') {
      const err = new Error('PERMISSION_DENIED');
      err.code = 'PERMISSION_DENIED';
      throw err;
    }
  }

  const photo = await Camera.getPhoto({
    quality,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: fromCamera ? CameraSource.Camera : CameraSource.Photos,
    width: maxWidth,
    height: maxWidth,
    preserveAspectRatio: true,
    correctOrientation: true,
  });

  const response = await fetch(photo.webPath);
  const blob = await response.blob();
  const filename = `photo_${Date.now()}.${photo.format || 'jpg'}`;

  return new File([blob], filename, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
}
