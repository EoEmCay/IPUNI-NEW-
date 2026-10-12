import { useEffect, useState } from 'react';
import { Sunrise, Sun, Sunset, Moon, Thermometer } from 'lucide-react';
import styles from './DayChip.module.css';

const TEMP_KEY = 'diaplus_temp_v1';
const TEMP_TTL = 10 * 60 * 1000; // Cập nhật lại nhiệt độ thực tế mỗi 10 phút

function getDayIcon(date) {
  const mins = date.getHours() * 60 + date.getMinutes();
  // 05:00 - 07:59: Bình minh
  if (mins >= 5 * 60 && mins < 8 * 60) {
    return { icon: Sunrise, periodLabel: 'Bình minh', color: '#F97316' };
  }
  // 08:00 - 15:59: Mặt trời (ban ngày)
  if (mins >= 8 * 60 && mins < 16 * 60) {
    return { icon: Sun, periodLabel: 'Ban ngày', color: '#F59E0B' };
  }
  // 16:00 - 18:29: Hoàng hôn
  if (mins >= 16 * 60 && mins < 18 * 60 + 30) {
    return { icon: Sunset, periodLabel: 'Hoàng hôn', color: '#EA580C' };
  }
  // 18:30 - 04:59: Mặt trăng (ban đêm)
  return { icon: Moon, periodLabel: 'Ban đêm', color: '#6366F1' };
}

const pad = (n) => String(n).padStart(2, '0');

async function fetchOpenMeteoTemp(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${Number(lat).toFixed(2)}&longitude=${Number(lon).toFixed(2)}&current=temperature_2m`;
  const res = await fetch(url);
  const data = await res.json();
  const t = Math.round(data?.current?.temperature_2m);
  return Number.isFinite(t) ? t : null;
}

async function resolveCoords() {
  // 1. Ưu tiên toạ độ GPS trình duyệt / điện thoại nếu được cấp quyền
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 30 * 60 * 1000,
          timeout: 6000,
        });
      });
      if (pos?.coords) {
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch {
      // Nếu người dùng từ chối GPS -> chuyển sang lấy vị trí theo IP mạng bên dưới
    }
  }

  // 2. Fallback tự động qua vị trí IP mạng (không cần hỏi quyền GPS)
  try {
    const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const ipData = await ipRes.json();
    if (ipData?.latitude && ipData?.longitude) {
      return { lat: Number(ipData.latitude), lon: Number(ipData.longitude) };
    }
  } catch {
    // ignore
  }

  // 3. Fallback mặc định TP.HCM nếu mạng chặn IP geo
  return { lat: 10.78, lon: 106.7 };
}

// Nhiệt độ thời gian thực tại vị trí người dùng qua Open-Meteo API, tự làm mới mỗi 10 phút
function useTemperature() {
  const [temp, setTemp] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(TEMP_KEY));
      return c && Date.now() - c.at < TEMP_TTL ? c.t : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let alive = true;

    const refreshTemp = async (force = false) => {
      try {
        if (!force) {
          const cached = JSON.parse(localStorage.getItem(TEMP_KEY));
          if (cached && Date.now() - cached.at < TEMP_TTL && Number.isFinite(cached.t)) {
            if (alive) setTemp(cached.t);
            return;
          }
        }
      } catch {
        // ignore
      }

      try {
        const { lat, lon } = await resolveCoords();
        const t = await fetchOpenMeteoTemp(lat, lon);
        if (t !== null && alive) {
          setTemp(t);
          try {
            localStorage.setItem(TEMP_KEY, JSON.stringify({ t, at: Date.now() }));
          } catch {
            // ignore
          }
        }
      } catch {
        // mất mạng: giữ số cũ hoặc ẩn
      }
    };

    refreshTemp(false);
    const interval = setInterval(() => refreshTemp(true), TEMP_TTL);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return temp;
}

// "🌙 01:19 | 13/10 | 26°C" — luôn cập nhật theo thời gian thực ngoài đời.
export default function DayChip() {
  const [now, setNow] = useState(() => new Date());
  const temp = useTemperature();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { icon: Icon, periodLabel, color } = getDayIcon(now);
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}`;

  return (
    <div className={styles.chip} title={`${periodLabel} • ${timeStr} ngày ${dateStr}`}>
      <Icon size={18} className={styles.icon} style={{ color }} aria-hidden="true" />
      <span className={styles.label}>{timeStr}</span>
      <span className={styles.sep} aria-hidden="true">|</span>
      <span>{dateStr}</span>
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
