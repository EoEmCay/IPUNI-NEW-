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
