import React from 'react';
import styles from './CutePillBox.module.css';

export default function CutePillBox() {
  return (
    <div className={styles.container}>
      <div className={styles.blurGlow}></div>
      
      <div className={`${styles.sphere} ${styles.sphereBlue}`}></div>
      <div className={`${styles.sphere} ${styles.sphereYellow}`}></div>
      <div className={`${styles.sphere} ${styles.sphereOrange}`}></div>

      <div className={`${styles.iconSvg} ${styles.iconMoon}`}>
        <svg fill="currentColor" height="40" viewBox="0 0 24 24" width="40"><path d="M12 3c.132 0 .263 0 .393.007a9 9 0 0 0 10.156 10.156A9 9 0 1 1 12 3z"></path></svg>
      </div>
      
      <div className={`${styles.iconSvg} ${styles.iconMoonRotated}`}>
        <svg fill="currentColor" height="30" viewBox="0 0 24 24" width="30"><path d="M12 3c.132 0 .263 0 .393.007a9 9 0 0 0 10.156 10.156A9 9 0 1 1 12 3z"></path></svg>
      </div>

      <div className={`${styles.iconSvg} ${styles.iconStar1}`}>
        <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"></path></svg>
      </div>

      <div className={`${styles.iconSvg} ${styles.iconStar2}`}>
        <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"></path></svg>
      </div>

      <div className={`${styles.iconSvg} ${styles.iconHeart}`}>
        <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
      </div>

      <div className={styles.heroSection}>
        <img 
          alt="Dreamy pastel pill box illustration" 
          className={styles.heroImage} 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD09Nh8-paxn9JMv1Y4mUm5d2HFYLzSDC6bnIht2SZbM7E_VZvUXpDLnrrLgwMo3XVUCUuvRbrcckJ8-G0NEsquqFxwqHrKuANXpX6pFAJVnMzNcBjkeumJf8wakirLGwCht579TjMoKOfwn01AX71-8LO9kM2uYs924-TJXpMJIHR-9xQkXZNBnLzugpJMMilBjGf4xkOChN_Wd32Jy_qR1VDziPcImUa33bKmAxErC3b94m0BHGBoHgpbBbq1smLGvwzKDoGB578" 
        />
        <div className={styles.textOverlay}>
          <p>Sắp xếp đơn thuốc</p>
        </div>
      </div>
    </div>
  );
}
