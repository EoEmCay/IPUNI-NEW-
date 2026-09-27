import { blinkFlash } from './native';
import { voiceAlertService } from '../services/voiceAlert.service';

// Mọi thông báo của app dùng chung hàm này: âm thanh (giọng người thân đã ghi âm cho loại
// thông báo đó, chưa có thì giọng đọc tự động) + rung + đèn (LED flash trên app điện thoại,
// nháy màn hình ở mọi nơi vì trình duyệt không bật được đèn LED).
export function notifyWithEffects(alertType, { meds = [], ttsText = null } = {}) {
  blinkFlash(4, 0.15); // rung + đèn LED (native)
  flashScreen();
  return voiceAlertService.playAlert(alertType, meds, null, ttsText);
}

// Nháy màn hình 3 lần (dưới 3 lần/giây theo WCAG 2.3.1 cho người nhạy cảm ánh sáng).
// Bỏ qua nếu người dùng bật "giảm chuyển động".
export function flashScreen() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;background:#FFFFFF;opacity:0;';
  document.body.appendChild(el);
  const blink = el.animate(
    [{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }],
    { duration: 400, iterations: 3, easing: 'ease-in-out' }
  );
  blink.onfinish = () => el.remove();
}
