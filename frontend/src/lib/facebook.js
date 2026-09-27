// Đăng nhập Facebook trên web (Facebook JS SDK). Nút chỉ hiện khi đã cài VITE_FACEBOOK_APP_ID.
export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

let sdkPromise = null;
function loadSdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: false, xfbml: false, version: 'v20.0' });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    s.async = true;
    s.onerror = () => { sdkPromise = null; reject(new Error('Không tải được Facebook')); };
    document.body.appendChild(s);
  });
  return sdkPromise;
}

// Nạp sẵn SDK khi mở trang đăng nhập để lúc bấm nút mở cửa sổ ngay (trình duyệt chặn popup
// nếu cửa sổ mở sau một lần chờ mạng).
export function preloadFacebook() {
  if (FACEBOOK_APP_ID) loadSdk().catch(() => {});
}

// Mở cửa sổ đăng nhập Facebook -> access token (null nếu người dùng huỷ)
export async function loginWithFacebook() {
  const FB = await loadSdk();
  return new Promise((resolve) => {
    FB.login((res) => resolve(res?.authResponse?.accessToken || null), { scope: 'public_profile,email' });
  });
}
