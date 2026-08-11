import { useState, useEffect } from 'react';
import { Activity, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ message, autoClose = false, onFinished }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!autoClose || !onFinished) return;

    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 600);
      return () => clearTimeout(hideTimer);
    }, 2200);

    return () => clearTimeout(timer);
  }, [autoClose, onFinished]);

  return (
    <div className={`${styles.splashOverlay} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.contentCard}>
        {/* Glow Ring & Logo */}
        <div className={styles.logoWrapper}>
          <div className={styles.pulseRing}></div>
          <div className={styles.pulseRing2}></div>
          <div className={styles.logoBadge}>
            <Activity className={styles.logoIcon} size={48} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className={styles.textGroup}>
          <h1 className={styles.brandTitle}>
            DIA<span className={styles.plusSymbol}>+</span>
          </h1>
          <p className={styles.tagline}>Hệ Thống Y Tế & Chăm Sóc Đái Tháo Đường</p>
        </div>

        {/* Health status wave */}
        <div className={styles.waveSection}>
          <div className={styles.heartPulse}>
            <Heart size={16} fill="currentColor" className={styles.heartIcon} />
            <span>{message || 'Đang kết nối hệ thống y tế DIA+...'}</span>
          </div>
          
          <div className={styles.progressTrack}>
            <div className={styles.progressBar}></div>
          </div>
        </div>

        {/* Footer badges */}
        <div className={styles.footerInfo}>
          <div className={styles.badgeItem}>
            <ShieldCheck size={14} />
            <span>Bảo mật y khoa</span>
          </div>
          <div className={styles.badgeItem}>
            <Sparkles size={14} />
            <span>Trợ lý AI 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
