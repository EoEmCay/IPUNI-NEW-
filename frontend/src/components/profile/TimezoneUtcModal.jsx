import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Globe,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Check,
  Compass,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import Modal from '../common/Modal';
import styles from './TimezoneUtcModal.module.css';

const TIMEZONE_KEY = 'diaplus_supervisor_selected_tz';

const POPULAR_TIMEZONES = [
  {
    id: 'us_austin',
    name: 'Austin, Texas (Hoa Kỳ)',
    zone: 'America/Chicago',
    flag: '🇺🇸',
    abbr: 'CT (CST/CDT)',
    region: 'Bắc Mỹ · Miền Trung Hoa Kỳ',
  },
  {
    id: 'us_washington_dc',
    name: 'Washington D.C. (Hoa Kỳ)',
    zone: 'America/New_York',
    flag: '🇺🇸',
    abbr: 'ET (EST/EDT)',
    region: 'Bắc Mỹ · Bờ Đông Hoa Kỳ',
  },
  {
    id: 'us_seattle',
    name: 'Seattle, Washington State (Hoa Kỳ)',
    zone: 'America/Los_Angeles',
    flag: '🇺🇸',
    abbr: 'PT (PST/PDT)',
    region: 'Bắc Mỹ · Bờ Tây Hoa Kỳ',
  },
  {
    id: 'us_california',
    name: 'California / San Francisco (Hoa Kỳ)',
    zone: 'America/Los_Angeles',
    flag: '🇺🇸',
    abbr: 'PT (PST/PDT)',
    region: 'Bắc Mỹ · Bờ Tây Hoa Kỳ',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    zone: 'Asia/Singapore',
    flag: '🇸🇬',
    abbr: 'SGT (UTC+8)',
    region: 'Đông Nam Á',
  },
  {
    id: 'vn_hcm',
    name: 'Việt Nam (Nơi Bố/Mẹ ở)',
    zone: 'Asia/Ho_Chi_Minh',
    flag: '🇻🇳',
    abbr: 'ICT (UTC+7)',
    region: 'Đông Nam Á · Giờ máy Bố/Mẹ',
  },
  {
    id: 'utc_global',
    name: 'UTC (Giờ Chuẩn Quốc Tế Y Khoa)',
    zone: 'UTC',
    flag: '🌐',
    abbr: 'UTC+0',
    region: 'Chuẩn ISO 8601 dữ liệu y tế',
  },
  {
    id: 'jp_tokyo',
    name: 'Tokyo (Nhật Bản)',
    zone: 'Asia/Tokyo',
    flag: '🇯🇵',
    abbr: 'JST (UTC+9)',
    region: 'Đông Á',
  },
  {
    id: 'au_sydney',
    name: 'Sydney (Úc)',
    zone: 'Australia/Sydney',
    flag: '🇦🇺',
    abbr: 'AEST/AEDT',
    region: 'Châu Đại Dương',
  },
];

function formatTimeInZone(date, timeZone) {
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    return {
      time: timeFormatter.format(date),
      date: dateFormatter.format(date),
      hour: parseInt(hourFormatter.format(date), 10),
    };
  } catch {
    return { time: '--:--:--', date: '--/--/----', hour: 12 };
  }
}

function getHourDiff(date, targetZone, baseZone = 'Asia/Ho_Chi_Minh') {
  try {
    const targetUtc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetDate = new Date(date.toLocaleString('en-US', { timeZone: targetZone }));
    const baseDate = new Date(date.toLocaleString('en-US', { timeZone: baseZone }));
    const diffHours = (targetDate - baseDate) / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10;
  } catch {
    return 0;
  }
}

export default function TimezoneUtcModal({ onClose }) {
  const [now, setNow] = useState(new Date());
  const [selectedTzId, setSelectedTzId] = useState(() => {
    return localStorage.getItem(TIMEZONE_KEY) || 'us_austin';
  });
  const [activeTab, setActiveTab] = useState('compare'); // 'compare' | 'world' | 'utc'

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectTz = (id) => {
    setSelectedTzId(id);
    localStorage.setItem(TIMEZONE_KEY, id);
  };

  const selectedTz = useMemo(
    () => POPULAR_TIMEZONES.find((t) => t.id === selectedTzId) || POPULAR_TIMEZONES[0],
    [selectedTzId]
  );

  const caregiverTime = useMemo(
    () => formatTimeInZone(now, selectedTz.zone),
    [now, selectedTz.zone]
  );

  const vnTime = useMemo(
    () => formatTimeInZone(now, 'Asia/Ho_Chi_Minh'),
    [now]
  );

  const utcTime = useMemo(
    () => formatTimeInZone(now, 'UTC'),
    [now]
  );

  const hourDiff = useMemo(
    () => getHourDiff(now, selectedTz.zone, 'Asia/Ho_Chi_Minh'),
    [now, selectedTz.zone]
  );

  // Gợi ý tư vấn y tế dựa trên giờ của Bố/Mẹ tại Việt Nam
  const caregiverTip = useMemo(() => {
    const vnHour = vnTime.hour;
    if (selectedTz.id === 'vn_hcm') {
      return 'Bạn đang ở cùng múi giờ với Bố/Mẹ tại Việt Nam. Thuận tiện nhắc nhở và thăm hỏi trực tiếp.';
    }
    if (vnHour >= 22 || vnHour < 6) {
      return '🌙 Bên Việt Nam đang là ban đêm (người cao tuổi đang ngủ). Cữ thuốc tối đã hoàn tất, không nên gọi điện thoại chuông lớn để tránh ảnh hưởng giấc ngủ của Bố/Mẹ.';
    }
    if (vnHour >= 6 && vnHour < 9) {
      return '🌅 Bên Việt Nam đang là buổi sáng sớm. Giờ Bố/Mẹ thường đo đường huyết trước ăn sáng và uống thuốc cữ sáng.';
    }
    if (vnHour >= 11 && vnHour < 13) {
      return '☀️ Bên Việt Nam đang là buổi trưa. Thời điểm kiểm tra cữ thuốc sau bữa ăn trưa.';
    }
    if (vnHour >= 17 && vnHour < 20) {
      return '🌇 Bên Việt Nam đang là buổi chiều tối. Rất thích hợp để gọi video hỏi thăm và nhắc cữ thuốc tối.';
    }
    return '⏱️ Dữ liệu đo đường huyết được đồng bộ tức thì giữa máy Bố/Mẹ và máy của bạn.';
  }, [vnTime.hour, selectedTz.id]);

  return (
    <Modal title="Múi Giờ Quốc Tế & UTC" onClose={onClose}>
      <div className={styles.container}>
        {/* THANH CHỌN TAB */}
        <div className={styles.tabNav} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'compare' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <Compass size={15} /> So Sánh (Mỹ/Sing ↔ VN)
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'world' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('world')}
          >
            <Clock size={15} /> Đồng Hồ Thế Giới
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'utc' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('utc')}
          >
            <Globe size={15} /> Chuẩn Y Tế UTC
          </button>
        </div>

        {/* ── TAB 1: SO SÁNH GIỜ CON Ở NƯỚC NGOÀI ↔ BỐ MẸ Ở VIỆT NAM ── */}
        {activeTab === 'compare' && (
          <div className={styles.tabContent}>
            {/* Bộ chọn thành phố người giám hộ */}
            <div className={styles.selectorCard}>
              <div className={styles.selectorHead}>
                <span className={styles.selectorLabel}>Vị trí của bạn (Người Giám Hộ):</span>
                <span className={styles.selectorHint}>Chọn múi giờ bạn đang sinh sống</span>
              </div>
              <div className={styles.chipRow}>
                {POPULAR_TIMEZONES.filter((t) => t.id !== 'utc_global').map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.tzChip} ${selectedTzId === t.id ? styles.tzChipActive : ''}`}
                    onClick={() => handleSelectTz(t.id)}
                  >
                    <span>{t.flag}</span> {t.name.split(' (')[0]}
                    {selectedTzId === t.id && <Check size={13} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* SO SÁNH 2 ĐỒNG HỒ SONG SONG */}
            <div className={styles.compareGrid}>
              {/* Thẻ 1: Người Giám Hộ */}
              <div className={styles.compareCard}>
                <div className={styles.cardHeaderSmall}>
                  <span className={styles.flagBadge}>{selectedTz.flag} Nơi Bạn Ở</span>
                  <span className={styles.abbrPill}>{selectedTz.abbr}</span>
                </div>
                <div className={styles.locationTitle}>{selectedTz.name}</div>
                <div className={styles.clockBig}>{caregiverTime.time}</div>
                <div className={styles.dateSub}>
                  {caregiverTime.hour >= 6 && caregiverTime.hour < 18 ? (
                    <Sun size={13} color="#f59e0b" />
                  ) : (
                    <Moon size={13} color="#6366f1" />
                  )}
                  {caregiverTime.date}
                </div>
              </div>

              {/* Thẻ 2: Bố Mẹ Tại Việt Nam */}
              <div className={`${styles.compareCard} ${styles.vnCard}`}>
                <div className={styles.cardHeaderSmall}>
                  <span className={styles.flagBadge}>🇻🇳 Bố/Mẹ (Việt Nam)</span>
                  <span className={styles.abbrPill}>ICT (UTC+7)</span>
                </div>
                <div className={styles.locationTitle}>Hồ Chí Minh / Hà Nội</div>
                <div className={`${styles.clockBig} ${styles.clockVn}`}>{vnTime.time}</div>
                <div className={styles.dateSub}>
                  {vnTime.hour >= 6 && vnTime.hour < 18 ? (
                    <Sun size={13} color="#f59e0b" />
                  ) : (
                    <Moon size={13} color="#6366f1" />
                  )}
                  {vnTime.date}
                </div>
              </div>
            </div>

            {/* Thẻ Độ Lệch Thời Gian & Gợi Ý Chăm Sóc */}
            <div className={styles.diffCard}>
              <div className={styles.diffHero}>
                <span className={styles.diffBadge}>
                  {hourDiff === 0
                    ? 'Cùng múi giờ (0h)'
                    : hourDiff > 0
                    ? `Bạn nhanh hơn Bố/Mẹ ${Math.abs(hourDiff)} tiếng`
                    : `Bạn chậm hơn Bố/Mẹ ${Math.abs(hourDiff)} tiếng`}
                </span>
                <span className={styles.syncPulse}>
                  <span className={styles.pulseDot} /> Đồng bộ trực tiếp
                </span>
              </div>
              <p className={styles.caregiverTipText}>{caregiverTip}</p>
            </div>
          </div>
        )}

        {/* ── TAB 2: ĐỒNG HỒ THẾ GIỚI (WORLD CLOCKS) ── */}
        {activeTab === 'world' && (
          <div className={styles.tabContent}>
            <div className={styles.worldList}>
              {POPULAR_TIMEZONES.map((item) => {
                const tzFormatted = formatTimeInZone(now, item.zone);
                const isSelected = selectedTzId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`${styles.worldItem} ${isSelected ? styles.worldItemActive : ''}`}
                    onClick={() => handleSelectTz(item.id)}
                  >
                    <div className={styles.worldItemLeft}>
                      <span className={styles.worldFlag}>{item.flag}</span>
                      <div>
                        <div className={styles.worldName}>
                          {item.name} {isSelected && <span className={styles.youBadge}>Bạn chọn</span>}
                        </div>
                        <div className={styles.worldRegion}>
                          {item.abbr} · {item.region}
                        </div>
                      </div>
                    </div>
                    <div className={styles.worldItemRight}>
                      <div className={styles.worldTime}>{tzFormatted.time}</div>
                      <div className={styles.worldDate}>{tzFormatted.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: CHUẨN Y TẾ UTC ── */}
        {activeTab === 'utc' && (
          <div className={styles.tabContent}>
            <section className={styles.utcCard}>
              <div className={styles.cardHeaderUtc}>
                <div className={styles.globeBadge}>
                  <Globe size={18} /> UTC (Coordinated Universal Time)
                </div>
                <span className={styles.syncStatus}>
                  <span className={styles.pulseDot} /> Chuẩn NTP Y Tế
                </span>
              </div>

              <div className={styles.timeHero}>
                <div className={styles.timeBig}>{utcTime.time}</div>
                <div className={styles.dateHero}>
                  <Calendar size={14} /> Ngày: <strong>{utcTime.date} (UTC)</strong>
                </div>
              </div>

              <div className={styles.isoTag}>
                <span>ISO 8601:</span> <code>{now.toISOString()}</code>
              </div>
            </section>

            <div className={styles.medicalNotice}>
              <ShieldCheck size={22} color="#059669" />
              <div>
                <h4 className={styles.noticeHeading}>Tại sao DIA+ dùng chuẩn UTC?</h4>
                <p className={styles.noticeText}>
                  Bác sĩ và người giám hộ tại nước ngoài (Mỹ, Singapore, Úc...) có thể ở các múi giờ khác nhau.
                  Bằng cách lưu trữ dữ liệu đường huyết và cữ uống thuốc theo chuẩn <strong>UTC</strong>,
                  hệ thống đảm bảo tính toàn vẹn 100% của hồ sơ bệnh án, không bao giờ xảy ra lỗi trùng cữ hay sai lệch thời gian đo.
                </p>
              </div>
            </div>
          </div>
        )}

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Đã hiểu & Đóng
        </button>
      </div>
    </Modal>
  );
}
