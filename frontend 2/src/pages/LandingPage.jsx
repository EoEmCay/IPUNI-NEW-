import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Camera, Brain, Sparkles, ChevronRight, Play, BookOpen, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useAuthStore from '../store/authStore';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.logo}>DIA+</div>
        <button onClick={() => setShowModal(true)} className={styles.loginBtn}>
          Đăng nhập
        </button>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={16} /> <span>Trợ lý sức khỏe thông minh</span>
          </div>
          <h1 className={styles.title}>
            Quản lý tiểu đường<br />
            <span className={styles.highlight}>Dễ dàng hơn bao giờ hết</span>
          </h1>
          <p className={styles.subtitle}>
            DIA+ giúp bạn theo dõi đường huyết, nhắc nhở uống thuốc và phân tích đơn thuốc tự động bằng AI.
          </p>
          <button onClick={() => setShowModal(true)} className={styles.ctaBtn}>
            Bắt đầu miễn phí <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Tính năng nổi bật</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <Camera size={28} />
            </div>
            <h3>Quét đơn thuốc bằng AI</h3>
            <p>Tự động nhận diện tên thuốc, công dụng, liều dùng chỉ qua một bức ảnh chụp.</p>
          </div>
          
          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Brain size={28} />
            </div>
            <h3>Nhắc nhở thông minh</h3>
            <p>Tự động nhắc giờ uống thuốc bằng giọng nói tiếng Việt thân thiện.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrap} style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <Activity size={28} />
            </div>
            <h3>Theo dõi chỉ số</h3>
            <p>Lưu trữ và theo dõi đường huyết, HbA1c, huyết áp dễ dàng.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.logo}>DIA+</div>
        <p>© 2026 IPUNI-NEW. All rights reserved.</p>
      </footer>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModal} onClick={() => setShowModal(false)}><X size={20}/></button>
            <h2 className={styles.modalTitle}>Bạn muốn bắt đầu như thế nào?</h2>
            
            <button 
              className={styles.choiceBtn}
              onClick={() => {
                localStorage.setItem('diaplus_has_seen_tour', 'true');
                navigate('/login');
              }}
              disabled={demoLoading}
            >
              <div className={styles.choiceIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <Play size={24} />
              </div>
              <div className={styles.choiceText}>
                <h3>Tự trải nghiệm</h3>
                <p>Tôi muốn tự khám phá các tính năng của DIA+</p>
              </div>
            </button>

            <button 
              className={styles.choiceBtn}
              onClick={async () => {
                setDemoLoading(true);
                try {
                  localStorage.setItem('diaplus_force_tour', 'true');
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
                <BookOpen size={24} />
              </div>
              <div className={styles.choiceText}>
                <h3>{demoLoading ? 'Đang vào...' : 'Hướng dẫn dùng app'}</h3>
                <p>Xem hướng dẫn chi tiết từng bước cho người mới</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
