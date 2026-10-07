import { useEffect, useState } from 'react';
import { Sun, Sunset, Moon, Thermometer } from 'lucide-react';
import styles from './DayChip.module.css';

const TEMP_KEY = 'diaplus_temp_v1';
const TEMP_TTL = 30 * 60 * 1000;

function dayPart() {
  const h = new Date().getHours();
  if (h < 11) return { label: 'Buổi sáng', icon: Sun };
  if (h < 14) return { label: 'Buổi trưa', icon: Sun };
  if (h < 18) return { label: 'Buổi chiều', icon: Sunset };
  return { label: 'Buổi tối', icon: Moon };
}

const pad = (n) => String(n).padStart(2, '0');

// Nhiệt độ hiện tại theo vị trí máy (Open-Meteo, miễn phí, không cần key). Toạ độ làm tròn ~1km
// trước khi gửi đi. Từ chối quyền vị trí / mất mạng -> ẩn nhiệt độ, không báo lỗi.
function useTemperature() {
  const [temp, setTemp] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(TEMP_KEY));
      return c && Date.now() - c.at < TEMP_TTL ? c.t : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (temp != null || !navigator.geolocation) return undefined;
    let alive = true;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}&current=temperature_2m`;
        const t = Math.round((await (await fetch(url)).json()).current.temperature_2m);
        if (!Number.isFinite(t)) return;
        try { localStorage.setItem(TEMP_KEY, JSON.stringify({ t, at: Date.now() })); } catch { /* bỏ qua */ }
        if (alive) setTemp(t);
      } catch { /* mất mạng: ẩn nhiệt độ */ }
    }, () => {}, { maximumAge: 60 * 60 * 1000, timeout: 10000 });
    return () => { alive = false; };
  }, [temp]);

  return temp;
}

// "Buổi tối | 07/10 | 28°C" — dùng ở Trang chủ và thanh trên các trang khác.
export default function DayChip() {
  const part = dayPart();
  const Icon = part.icon;
  const now = new Date();
  const temp = useTemperature();
  return (
    <div className={styles.chip}>
      <Icon size={18} className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{part.label}</span>
      <span className={styles.sep} aria-hidden="true">|</span>
      <span>{`${pad(now.getDate())}/${pad(now.getMonth() + 1)}`}</span>
      {temp != null && (
        <>
          <span className={styles.sep} aria-hidden="true">|</span>
          <span className={styles.temp} aria-label={`Nhiệt độ ${temp} độ C`}>
            <Thermometer size={16} aria-hidden="true" />{temp}°C
          </span>
        </>
      )}
    </div>
  );
}
