import { useState, useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import useAuthStore from '../../store/authStore';
import { useT } from '../../hooks/useT';
import './OnboardingTour.css';

// Hướng dẫn cho giao diện mới (10/2026): mọi bước đều nằm ở Trang chủ -> không chuyển trang giữa chừng.
const STEPS = [
  ['.tour-scan', 'scan'],
  ['.tour-meds', 'meds'],
  ['.tour-schedule', 'schedule'],
  ['.tour-glucose', 'glucose'],
  ['.tour-sos', 'sos'],
  ['.tour-nav', 'nav'],
];

export default function OnboardingTour() {
  const [showChoice, setShowChoice] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const runTour = () => {
    const steps = STEPS.filter(([sel]) => document.querySelector(sel)).map(([element, key]) => ({
      element,
      popover: { title: t.tour[`${key}Title`], description: t.tour[`${key}Desc`], side: 'top', align: 'center' },
    }));
    if (!steps.length) return;
    driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      nextBtnText: t.tour.nextBtn,
      prevBtnText: t.tour.prevBtn,
      doneBtnText: t.tour.doneBtn,
      progressText: t.tour.progressText,
      steps,
      // Đưa ô đang chỉ vào giữa màn hình, tránh bị thanh điều hướng dưới che
      onHighlightStarted: (el) => el?.scrollIntoView({ block: 'center' }),
    }).drive();
  };

  const startTour = () => {
    if (location.pathname !== '/dashboard') navigate('/dashboard');
    setTimeout(runTour, 600); // chờ Trang chủ vẽ xong lưới tiện ích
  };

  useEffect(() => {
    if (!user || ['/login', '/register', '/'].includes(location.pathname)) return undefined;

    const isDemoUser = user.is_demo || (user.email && user.email.startsWith('demo_'));
    const forceTour = localStorage.getItem('diaplus_force_tour');
    const hasSeenTour = localStorage.getItem('diaplus_has_seen_tour');

    if (forceTour || (isDemoUser && !hasSeenTour)) {
      const timer = setTimeout(() => {
        startTour();
        localStorage.removeItem('diaplus_force_tour');
        localStorage.setItem('diaplus_has_seen_tour', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!isDemoUser && !hasSeenTour) {
      const timer = setTimeout(() => setShowChoice(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  const handleChoice = (wantTour) => {
    setShowChoice(false);
    localStorage.setItem('diaplus_has_seen_tour', 'true');
    if (wantTour) startTour();
  };

  if (!showChoice) return null;
  return (
    <Modal title={t.tour.modalTitle} onClose={() => handleChoice(false)}>
      <div className="tour-choice">
        <p className="tour-choice-desc">{t.tour.modalDesc}</p>
        <button type="button" className="tour-choice-start" onClick={() => handleChoice(true)}>{t.tour.btnStart}</button>
        <button type="button" className="tour-choice-skip" onClick={() => handleChoice(false)}>{t.tour.btnSkip}</button>
      </div>
    </Modal>
  );
}
