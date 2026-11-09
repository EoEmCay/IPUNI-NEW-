/**
 * Lớp tương thích Capacitor (native iOS) <-> web.
 * Mọi nơi khác trong app import từ đây, không import trực tiếp @capacitor/* rải rác.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

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

    // iOS không có nút back cứng; xử lý cử chỉ vuốt & sự kiện back của Android nếu build sau này
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
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
    isAvailable: async () => ({ available: false })
  })
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
 * Chụp hoặc chọn ảnh native qua Capacitor Camera với độ nén tối ưu phần cứng.
 * Tự động kiểm tra quyền, nén ảnh xuống max 1600px và trả về đối tượng File chuẩn web.
 * @param {Object} options
 * @param {boolean} options.fromCamera - true: chụp ảnh từ camera; false: chọn từ thư viện ảnh
 * @param {number} options.quality - chất lượng ảnh (0-100, mặc định 85)
 * @param {number} options.maxWidth - độ phân giải tối đa (mặc định 1600px)
 * @returns {Promise<File|null>}
 */
export async function captureNativePhoto({ fromCamera = true, quality = 85, maxWidth = 1600 } = {}) {
  if (!isNative) return null;

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

  // 1. Kiểm tra và yêu cầu quyền thiết bị
  try {
    const permStatus = await Camera.checkPermissions();
    const needed = fromCamera ? permStatus.camera : permStatus.photos;
    if (needed !== 'granted') {
      const requested = await Camera.requestPermissions({
        permissions: fromCamera ? ['camera'] : ['photos']
      });
      const result = fromCamera ? requested.camera : requested.photos;
      if (result !== 'granted' && result !== 'limited') {
        const err = new Error('PERMISSION_DENIED');
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
    }
  } catch (permErr) {
    if (permErr.code === 'PERMISSION_DENIED') throw permErr;
    // Bỏ qua lỗi checkPermissions trên một số bản Capacitor webview giả lập
  }

  // 2. Chụp/chọn ảnh với các thông số nén tối ưu ngay từ tầng OS
  const photo = await Camera.getPhoto({
    quality,
    width: maxWidth,
    height: maxWidth,
    preserveAspectRatio: true,
    correctOrientation: true,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: fromCamera ? CameraSource.Camera : CameraSource.Photos,
  });

  // 3. Chuyển đổi thành File object tương thích với luồng Web
  let blob = null;
  if (photo.webPath) {
    try {
      const res = await fetch(photo.webPath);
      blob = await res.blob();
    } catch {
      // Fallback nếu fetch webPath bị chặn
    }
  }

  if (!blob && photo.dataUrl) {
    const res = await fetch(photo.dataUrl);
    blob = await res.blob();
  }

  if (!blob) {
    throw new Error('FAILED_TO_LOAD_IMAGE');
  }

  const ext = photo.format || 'jpg';
  const fileName = `prescription_${Date.now()}.${ext}`;
  return new File([blob], fileName, {
    type: blob.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    lastModified: Date.now(),
  });
}
