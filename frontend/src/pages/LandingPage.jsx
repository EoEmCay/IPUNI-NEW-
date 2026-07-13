import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Camera, Brain, Sparkles, ChevronRight, Play, BookOpen, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useAuthStore from '../store/authStore';
import { useT } from '../hooks/useT';
import api from '../services/api';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const t = useT();
  const [showModal, setShowModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Background ping to wake up the Render backend from sleep (cold start)
      // This ensures that when the user clicks demoLogin, it's blazing fast
      // We don't care if it returns 404, we just want to hit the server
      api.get./health.catch(() => {});
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.logo}>DIA+</div>
        <button onClick={() => setShowModal(true)} className={styles.loginBtn}>
          {t.auth.loginBtn}
        </button>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={16} /> <span>{t.landing.badge}</span>
          </div>
          <h1 className={styles.title}>
            {t.landing.title1}<br />
            <span className={styles.highlight}>{t.landing.title2}</span>
          </h1>
          <p className={styles.subtitle}>
            {t.landing.subtitle}
          </p>
          <button onClick={() => setShowModal(true)} className={styles.ctaBtn}>
            {t.landing.cta} <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>{t.landing.featuresTitle}</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <Camera size={28} />
            </div>
            <h3>{t.landing.feature1Title}</h3>
            <p>{t.landing.feature1Desc}</p>
          </div>
          
          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Brain size={28} />
            </div>
            <h3>{t.landing.feature2Title}</h3>
            <p>{t.landing.feature2Desc}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <Activity size={28} />
            </div>
            <h3>{t.landing.feature3Title}</h3>
            <p>{t.landing.feature3Desc}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.logo}>DIA+</div>
        <p>© 2026 DIA+. All rights reserved.</p>
      </footer>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}><X size={20}/></button>
            <h2 className={styles.modalTitle}>{t.landing.modalTitle}</h2>
            
            <button 
              className={styles.choiceBtn}
              onClick={() => {
                navigate('/login');
              }}
              disabled={demoLoading}
            >
              <div className={styles.choiceIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <Play size={24} />
              </div>
              <div className={styles.choiceText}>
                <h3>{t.landing.choice1Title}</h3>
                <p>{t.landing.choice1Desc}</p>
              </div>
            </button>

            <button 
              className={styles.choiceBtn}
              onClick={async () => {
                setDemoLoading(true);
                try {
                  await demoLogin();
                  navigate('/dashboard');
                } catch (err) {
                  console.error(err);
                } finally {
                  setDemoLoading(false);
                }
              }}
              disabled={demoLoading}
            >
              <div className={styles.choiceIcon} style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Sparkles size={24} />
              </div>
              <div className={styles.choiceText}>
                <h3>{demoLoading ? t.common.loading : t.landing.choice2Title}</h3>
                <p>{t.landing.choice2Desc}</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
