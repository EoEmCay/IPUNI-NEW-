import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Sparkles, Play, X, Calendar, Mic, LineChart, CloudUpload, Clock, Link, Globe, Users, HeartPulse, ShieldCheck, Phone, Mail, Camera, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useAuthStore from '../store/authStore';
import { useT } from '../hooks/useT';
import useLangStore from '../store/langStore';
import styles from './LandingPage.module.css';


const features = [
  {
    num: "01", icon: Mic,
    color: "#6366F1", colorBg: "rgba(99,102,241,0.12)",
    titleKey: "f1Title", descKey: "f1Desc", demoKey: "f1Demo", effectKey: "f1Effect",
    visual: "voice"
  },
  {
    num: "02", icon: Camera,
    color: "#F59E0B", colorBg: "rgba(245,158,11,0.12)",
    titleKey: "f2Title", descKey: "f2Desc", demoKey: "f2Demo", effectKey: "f2Effect",
    visual: "scan"
  },
  {
    num: "03", icon: LineChart,
    color: "#10B981", colorBg: "rgba(16,185,129,0.12)",
    titleKey: "f3Title", descKey: "f3Desc", demoKey: "f3Demo", effectKey: "f3Effect",
    visual: "chart"
  },
  {
    num: "04", icon: Calendar,
    color: "#8B5CF6", colorBg: "rgba(139,92,246,0.12)",
    titleKey: "f4Title", descKey: "f4Desc", demoKey: "f4Demo", effectKey: "f4Effect",
    visual: "cal"
  },
  {
    num: "05", icon: CloudUpload,
    color: "#0EA5E9", colorBg: "rgba(14,165,233,0.12)",
    titleKey: "f5Title", descKey: "f5Desc", demoKey: "f5Demo", effectKey: "f5Effect",
    visual: "offline"
  }
];

import SplashScreen from '../components/common/SplashScreen';

export default function LandingPage() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const lang = useLangStore(s => s.lang);
  const t = useT();
  const text = t.landing;

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add(styles.visible);
      });
    }, { threshold: 0.08 });
    setTimeout(() => {
      document.querySelectorAll(`.${styles.featureCard}, .${styles.impactStat}, .${styles.treeNode}`)
        .forEach(el => observerRef.current.observe(el));
    }, 100);
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className={styles.container}>
      {demoLoading && <SplashScreen message="Đang khởi tạo tài khoản dùng thử DIA+..." />}
      {/* ── NAVBAR ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <img src="/logo.jpg" alt="DIA+" className={styles.navLogoImg} />
          <span className={styles.navLogoText}>IAPLUS.VN</span>
        </div>
        <div className={styles.navMenu}>
          <a href="#home" className={styles.navLink}>{text.navHome}</a>
          <a href="#video-showcase" className={styles.navLink}>Video Dự Án</a>
          <a href="#features" className={styles.navLink}>{text.navFeatures}</a>
          <a href="#impact" className={styles.navLink}>{text.navImpact}</a>
          <a href="#contact" className={styles.navLink}>{text.navContact}</a>
        </div>
        <div className={styles.navActions}>
          <div className={styles.langToggle} style={{ pointerEvents: 'none', background: 'transparent', boxShadow: 'none' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Ngôn ngữ: Sắp ra mắt</span>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <header id="home" className={styles.hero}>
        {/* Dynamic Aurora & Starfield Background */}
        <div className={styles.heroStars}></div>
        <div className={styles.heroAurora}>
          <div className={styles.auroraBlob1}></div>
          <div className={styles.auroraBlob2}></div>
          <div className={styles.auroraBlob3}></div>
        </div>
        <div className={styles.heroMeteors}>
          <div className={`${styles.meteor} ${styles.meteor1}`}></div>
          <div className={`${styles.meteor} ${styles.meteor2}`}></div>
          <div className={`${styles.meteor} ${styles.meteor3}`}></div>
        </div>
        <div className={styles.heroGrid}></div>
        
        <div className={styles.heroInner}>
          <div className={`${styles.heroBadge}`}>
            <span className={styles.heroBadgeDot} />
            {text.heroBadge}
          </div>
          <h1 className={styles.heroTitle}>
            {text.heroTitle1}<br />
            <span className={styles.heroHighlight}>{text.heroTitle2}</span>
          </h1>
          <p className={styles.heroSubtitle}>{text.heroSubtitle}</p>
          <div className={styles.heroCtas}>
            <button onClick={() => setShowModal(true)} className={styles.heroBtn}>
              {text.heroBtn} <ArrowRight size={18} />
            </button>
            <a href="#video-showcase" className={styles.heroVideoBtn}>
              <Play size={16} fill="currentColor" /> Xem Video Dự Án
            </a>
          </div>
          {/* Download Badges */}
          <div className={styles.storeRow}>
            <a href="#" className={styles.storeBadge}>
              <svg viewBox="0 0 24 24" className={styles.storeIcon}><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div className={styles.storeText}>
                <span className={styles.storeLabel}>Download on the</span>
                <span className={styles.storeName}>App Store</span>
              </div>
            </a>
            <a href="#" className={styles.storeBadge}>
                <svg viewBox="30 336.7 120.9 129.2" className={styles.storeIcon}>
                  <path fill="#4285F4" d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"/>
                  <path fill="#34A853" d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"/>
                  <path fill="#FBBC04" d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"/>
                  <path fill="#EA4335" d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z"/>
                </svg>
                <div className={styles.storeText}>
                <span className={styles.storeLabel}>GET IT ON</span>
                <span className={styles.storeName}>Google Play</span>
              </div>
            </a>
          </div>

          {/* ── HIGHLIGHT PRODUCT VIDEO SHOWCASE (Full HD 1080p) ── */}
          <div id="video-showcase" className={styles.videoShowcaseSection}>
            <div className={styles.videoMockupWindow}>
              <div className={styles.windowHeader}>
                <div className={styles.windowControls}>
                  <span className={`${styles.windowDot} ${styles.dotRed}`} />
                  <span className={`${styles.windowDot} ${styles.dotYellow}`} />
                  <span className={`${styles.windowDot} ${styles.dotGreen}`} />
                </div>
                <div className={styles.windowTitle}>
                  <Sparkles size={13} color="#818cf8" />
                  <span>DIAPLUS.VN • NTTU INNOVATION STARTUP CHALLENGE 2026</span>
                </div>
                <div className={styles.hdTag}>
                  <span className={styles.hdPulse} />
                  <span>Full HD 1080p</span>
                </div>
              </div>

              <div className={styles.videoPlayerWrapper}>
                <video
                  className={styles.showcaseVideo}
                  poster="/videos/diaplus_poster.jpg"
                  src="/videos/diaplus_intro_1080p.mp4"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
            {/* Ambient Background Glow Effect */}
            <div className={styles.videoAmbientGlow} />
          </div>
        </div>
      </header>

      {/* ── FEATURE TREE SECTION ── */}
      <section id="features" className={styles.treeSection}>
        <div className={styles.treeSectionHeader}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} /> <span>{text.discoverBadge}</span>
          </div>
          <h2 className={styles.sectionTitle}>{text.discoverTitle}</h2>
          <p className={styles.sectionSub}>{text.discoverSubtitle}</p>
        </div>

        <div className={styles.treeWrap}>
          {/* Central trunk */}
          <div className={styles.trunk} />

          {features.map((f, i) => {
            const Icon = f.icon;
            const isLeft = i % 2 === 0;
            return (
              <div key={i} className={`${styles.treeNode} ${isLeft ? styles.nodeLeft : styles.nodeRight}`}>
                {/* Branch line */}
                <div className={styles.branch} style={{ '--color': f.color }} />
                {/* Node dot */}
                <div className={styles.nodeDot} style={{ background: f.color }}>
                  <span>{f.num}</span>
                </div>
                {/* Card */}
                <div className={styles.featureCard} style={{ '--accent': f.color }}>
                  <div className={styles.featureCardTop}>
                    <div className={styles.featureIconWrap} style={{ background: f.colorBg }}>
                      <Icon size={22} color={f.color} />
                    </div>
                    <h3 className={styles.featureTitle}>{text[f.titleKey]}</h3>
                  </div>
                  <p className={styles.featureDesc}>{text[f.descKey]}</p>

                  {/* Mini Visual Demo */}
                  <div className={styles.featureDemo}>
                    {f.visual === 'voice' && (
                      <div className={styles.waveDemo}>
                        {[...Array(9)].map((_, j) => <span key={j} className={styles.waveBar} style={{ '--j': j }} />)}
                      </div>
                    )}
          {f.visual === 'scan' && (
                      <div className={styles.scanDemo}>
                        <div className={styles.scanFrame}>
                          <div className={styles.scanLaser} />
                          <div className={styles.scanRows}>
                            <div className={styles.scanRow}>
                              <span className={styles.scanLabel}>{text.demoMeds || 'Thuốc'}</span>
                              <span className={styles.scanValue}>Metformin 500mg</span>
                            </div>
                            <div className={styles.scanRow}>
                              <span className={styles.scanLabel}>{text.demoDosage || 'Liều dùng'}</span>
                              <span className={styles.scanValue}>2 {text.demoTimes || 'lần / ngày'}</span>
                            </div>
                            <div className={styles.scanRow}>
                              <span className={styles.scanLabel}>{text.demoPurpose || 'Công dụng'}</span>
                              <span className={styles.scanValue}>{text.demoDiabetes || 'Hạ đường huyết'}</span>
                            </div>
                            <div className={styles.scanRow}>
                              <span className={styles.scanLabel}>{text.demoNote || 'Ghi chú'}</span>
                              <span className={styles.scanValue}>{text.demoAfterMeal || 'Uống sau ăn'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {f.visual === 'chart' && (
                      <div className={styles.chartDemo}>
                        <svg viewBox="0 0 120 40" width="100%" height="40">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={f.color} stopOpacity="0.4"/>
                              <stop offset="100%" stopColor={f.color} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M0 35 L24 22 L48 28 L72 8 L96 14 L120 6" fill="none" stroke={f.color} strokeWidth="2.5" strokeLinecap="round"/>
                          <path d="M0 35 L24 22 L48 28 L72 8 L96 14 L120 6 L120 40 L0 40Z" fill="url(#chartGrad)"/>
                        </svg>
                      </div>
                    )}
                    {f.visual === 'cal' && (
                      <div className={styles.calDemo}>
                        <div className={styles.calPill} style={{ background: f.colorBg, color: f.color }}>08:00 • Metformin</div>
                        <div className={styles.calPill} style={{ background: f.colorBg, color: f.color }}>12:00 • Glimepiride</div>
                        <div className={styles.calPill} style={{ background: f.colorBg, color: f.color }}>20:00 • Insulin</div>
                      </div>
                    )}
                    {f.visual === 'offline' && (
                      <div className={styles.offlineDemo}>
                        <ShieldCheck size={28} color={f.color} />
                        <span style={{ color: f.color, fontSize: 12, fontWeight: 600 }}>SECURED</span>
                      </div>
                    )}
                  </div>

                  {/* Effect ticker */}
                  <div className={styles.effectTicker} style={{ borderColor: f.color + '33', background: f.colorBg }}>
                    <span className={styles.effectDot} style={{ background: f.color }} />
                    <span className={styles.effectText} style={{ color: f.color }}>{text[f.effectKey]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── IMPACT SECTION ── */}
      <section id="impact" className={styles.impactSection}>
        <div className={styles.impactBg} />
        <div className={styles.impactInner}>
          <div className={styles.sectionBadge} style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.1)' }}>
            <Activity size={14} /> <span>{text.impactBadge}</span>
          </div>
          <h2 className={styles.impactTitle}>{text.impactTitle}</h2>
          <p className={styles.impactSub}>{text.impactSubtitle}</p>
          <div className={styles.impactGrid}>
            {[
              { icon: HeartPulse, val: text.impact1Val, title: text.impact1Title, desc: text.impact1Desc, color: '#f43f5e' },
              { icon: Clock, val: text.impact2Val, title: text.impact2Title, desc: text.impact2Desc, color: '#f59e0b' },
              { icon: Activity, val: text.impact3Val, title: text.impact3Title, desc: text.impact3Desc, color: '#10b981' },
              { icon: ShieldCheck, val: text.impact4Val, title: text.impact4Title, desc: text.impact4Desc, color: '#6366f1' },
            ].map((item, i) => (
              <div key={i} className={styles.impactStat}>
                <div className={styles.impactIconWrap} style={{ color: item.color, background: item.color + '1a' }}>
                  <item.icon size={22} />
                </div>
                <div className={styles.impactVal} style={{ '--c': item.color }}>{item.val}</div>
                <div className={styles.impactStatTitle}>{item.title}</div>
                <div className={styles.impactStatDesc}>{item.desc}</div>
                <div className={styles.impactBar}><div className={styles.impactBarFill} style={{ background: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.footerGlow} />
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            {/* Brand */}
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <img src="/logo.jpg" alt="DIA+" className={styles.footerLogoImg} />
                <span className={styles.footerLogoText}>IAPLUS.VN</span>
              </div>
              <p className={styles.footerDesc}>{text.footerDesc}</p>
              <div className={styles.footerSocials}>
                <a href="https://www.linkedin.com/in/khoile-tech/" target="_blank" rel="noreferrer" className={styles.footerSocialBtn}><Link size={16} /></a>
                <a href="https://diaplus.vn" target="_blank" rel="noreferrer" className={styles.footerSocialBtn}><Globe size={16} /></a>
                <a href="mailto:khoile3006.official@gmail.com" className={styles.footerSocialBtn}><Mail size={16} /></a>
              </div>
            </div>

            {/* Links */}
            <div className={styles.footerLinks}>
              <h4 className={styles.footerColTitle}>{text.footerLinks}</h4>
              <ul>
                <li><a href="#">{text.footerPrivacy}</a></li>
                <li><a href="#">{text.footerTerms}</a></li>
                <li><a href="#">{text.footerCookies}</a></li>
              </ul>
            </div>

            {/* Project Rep */}
            <div className={styles.footerRep}>
              <h4 className={styles.footerColTitle}>{text.footerProjectRep}</h4>
              <ul>
                <li>
                  <Users size={14} />
                  <span>{lang === 'vi' ? 'Lê Minh Khôi' : 'Le Minh Khoi'} <em>({text.footerFounder})</em></span>
                </li>
                <li><Phone size={14} /><span>(+84) 986897439</span></li>
                <li><Mail size={14} /><span>khoile3006.official@gmail.com</span></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© 2026 DIA+. All rights reserved.</span>
            <div className={styles.footerBottomLinks}>
              <a href="#">{text.footerPrivacy}</a>
              <span>·</span>
              <a href="#">{text.footerTerms}</a>
              <span>·</span>
              <a href="#">{text.footerCookies}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}><X size={20}/></button>
            <h2 className={styles.modalTitle}>{text.modalTitle}</h2>
            <button className={styles.choiceBtn} onClick={() => navigate('/login')} disabled={demoLoading}>
              <div className={styles.choiceIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}><Users size={24} /></div>
              <div className={styles.choiceText}><h3>{text.modalBtn1Title}</h3><p>{text.modalBtn1Desc}</p></div>
            </button>
            <button className={styles.choiceBtn} disabled={demoLoading} onClick={async () => {
              setDemoLoading(true);
              try {
                localStorage.setItem('diaplus_force_tour', 'true');
                await demoLogin();
                navigate('/dashboard');
              } catch (err) { console.error(err); } finally { setDemoLoading(false); }
            }}>
              <div className={styles.choiceIcon} style={{ background: '#FEF3C7', color: '#D97706' }}><Play size={24} /></div>
              <div className={styles.choiceText}><h3>{demoLoading ? text.modalBtn2TitleLoading : text.modalBtn2Title}</h3><p>{text.modalBtn2Desc}</p></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
