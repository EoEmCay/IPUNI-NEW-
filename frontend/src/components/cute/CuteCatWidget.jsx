import styles from './CuteCatWidget.module.css';

const CAT_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCy-Gfl6ZBuN49Zw5XA2LX0LuIf3Qk1rZjLgWtK2DL6F0rRVadkOay17Uu67znz4NU6am_vpTStzP-c73kEA2vheJEkwWzxfgwD-17Igw9ZmVXAlJJfc4sSHZhD96CjTWEN9g-ydFj-QnzinEU0L3QT9P1akdskbTtN2qaYsl5yBx3vwb03Mb7aVkue4SIQ6zHzkD8LHYN5lqJA9aAySCJuP5kOIfkCVs67-HaOVj_TQZIp2Mv-BlmlgsDIpDrd3wepQIaMPhIMuA';

export default function CuteCatWidget() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.glow} />

      <div className={styles.catContainer}>
        <img
          src={CAT_IMAGE}
          alt="Mèo dễ thương"
          className={styles.catImage}
        />
      </div>

      <div className={styles.heartbeatContainer}>
        <svg viewBox="0 0 400 100" className={styles.heartSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 50 L120 50 L130 65 L145 35 L160 85 L180 15 L200 95 L220 50 L300 50 L315 75 L330 40 L345 50 L400 50"
            stroke="url(#heartGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="heartGrad" x1="0" x2="400" y1="50" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#C0B3E5" stopOpacity="0.6" />
              <stop offset="0.4" stopColor="#7EA5E8" />
              <stop offset="0.6" stopColor="#7EA5E8" />
              <stop offset="1" stopColor="#C0B3E5" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <p className={styles.label}>Thao đổi nhịp tim</p>
    </div>
  );
}
