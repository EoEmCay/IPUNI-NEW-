import styles from './CuteAstronautCat.module.css';

export default function CuteAstronautCat({ size = 'full' }) {
  if (size === 'icon') {
    return (
      <svg viewBox="0 0 36 36" className={styles.iconSvg} aria-hidden="true">
        <circle cx="18" cy="16" r="13" className={styles.helmet}/>
        <circle cx="18" cy="16" r="10" className={styles.helmetGlass}/>
        <circle cx="13" cy="14" r="3" className={styles.eye}/>
        <circle cx="23" cy="14" r="3" className={styles.eye}/>
        <circle cx="14" cy="13" r="1" className={styles.shine}/>
        <circle cx="24" cy="13" r="1" className={styles.shine}/>
        <ellipse cx="18" cy="18" rx="2" ry="1.5" className={styles.nose}/>
        <path d="M15 21 Q18 24 21 21" className={styles.mouth}/>
        <polygon points="7,6 10,13 5,13" className={styles.ear}/>
        <polygon points="29,6 26,13 31,13" className={styles.ear}/>
        <rect x="10" y="28" width="16" height="7" rx="4" className={styles.suit}/>
      </svg>
    );
  }

  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 120 140" className={styles.svg} aria-hidden="true">
        {/* Floating pills */}
        <g className={styles.pill1}>
          <rect x="84" y="18" width="22" height="12" rx="6" className={styles.pillA}/>
          <line x1="95" y1="18" x2="95" y2="30" className={styles.pillLine}/>
        </g>
        <g className={styles.pill2}>
          <rect x="10" y="28" width="20" height="11" rx="5.5" className={styles.pillB}/>
          <line x1="20" y1="28" x2="20" y2="39" className={styles.pillLine}/>
        </g>
        <g className={styles.pill3}>
          <rect x="86" y="88" width="18" height="10" rx="5" className={styles.pillC}/>
          <line x1="95" y1="88" x2="95" y2="98" className={styles.pillLine}/>
        </g>
        {/* Sparkle stars near pills */}
        <text x="78" y="42" className={styles.pillStar}>✦</text>
        <text x="6" y="50" className={styles.pillStar}>✧</text>
        <text x="96" y="82" className={styles.pillStar}>✦</text>

        {/* Suit body */}
        <rect x="32" y="96" width="56" height="28" rx="14" className={styles.suitBody}/>
        {/* Suit buttons */}
        <circle cx="50" cy="108" r="4" className={styles.suitBtn}/>
        <circle cx="60" cy="108" r="4" className={styles.suitBtn}/>
        <circle cx="70" cy="108" r="4" className={styles.suitBtn}/>
        {/* Suit collar */}
        <ellipse cx="60" cy="96" rx="20" ry="8" className={styles.suitCollar}/>

        {/* Arms */}
        <path d="M32 106 Q18 112 22 124 Q26 132 36 126" className={styles.suitArm}/>
        <path d="M88 106 Q102 112 98 124 Q94 132 84 126" className={styles.suitArm}/>

        {/* Helmet outer (glow) */}
        <circle cx="60" cy="54" r="42" className={styles.helmetGlow}/>
        {/* Helmet */}
        <circle cx="60" cy="54" r="38" className={styles.helmet}/>
        {/* Helmet visor reflection */}
        <path d="M28 44 Q42 36 60 36" className={styles.helmetReflect}/>
        {/* Cat face in helmet */}
        {/* Cat head */}
        <circle cx="60" cy="56" r="24" className={styles.catFace}/>
        {/* Ears */}
        <polygon points="40,34 46,50 34,50" className={styles.catFace}/>
        <polygon points="80,34 74,50 86,50" className={styles.catFace}/>
        <polygon points="41,37 45,48 36,48" className={styles.catInnerEar}/>
        <polygon points="79,37 75,48 84,48" className={styles.catInnerEar}/>
        {/* Eyes */}
        <circle cx="50" cy="52" r="6.5" className={styles.eyeWhite}/>
        <circle cx="70" cy="52" r="6.5" className={styles.eyeWhite}/>
        <circle cx="50" cy="52" r="4.5" className={styles.iris}/>
        <circle cx="70" cy="52" r="4.5" className={styles.iris}/>
        <ellipse cx="50" cy="52" rx="2" ry="3" className={styles.pupil}/>
        <ellipse cx="70" cy="52" rx="2" ry="3" className={styles.pupil}/>
        <circle cx="52" cy="49" r="1.8" className={styles.shine}/>
        <circle cx="72" cy="49" r="1.8" className={styles.shine}/>
        {/* Nose */}
        <ellipse cx="60" cy="60" rx="3" ry="2" className={styles.nose}/>
        {/* Happy mouth */}
        <path d="M56 63 Q60 68 64 63" className={styles.mouth}/>
        {/* Whiskers */}
        <line x1="38" y1="60" x2="55" y2="61" className={styles.whisker}/>
        <line x1="38" y1="64" x2="55" y2="63" className={styles.whisker}/>
        <line x1="65" y1="61" x2="82" y2="60" className={styles.whisker}/>
        <line x1="65" y1="63" x2="82" y2="64" className={styles.whisker}/>
        {/* Cheek blush */}
        <ellipse cx="44" cy="62" rx="6" ry="4" className={styles.blush}/>
        <ellipse cx="76" cy="62" rx="6" ry="4" className={styles.blush}/>
        {/* Helmet rim */}
        <circle cx="60" cy="54" r="38" className={styles.helmetRim}/>
      </svg>

      <div className={styles.floatLabel}>Phi hành gia thuốc 🚀</div>
    </div>
  );
}
