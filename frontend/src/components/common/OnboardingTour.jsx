import { useState, useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import useAuthStore from '../../store/authStore';
import { useT } from '../../hooks/useT';
import './OnboardingTour.css';

export default function OnboardingTour() {
  const [showChoice, setShowChoice] = useState(false);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();

  const steps = [
    {
      element: '.tour-step-1',
      popover: { title: t.tour.step1Title, description: t.tour.step1Desc, side: 'bottom', align: 'start' },
      route: '/dashboard'
    },
    {
      element: '.tour-step-2',
      popover: { title: t.tour.step2Title, description: t.tour.step2Desc, side: 'bottom', align: 'start' },
      route: '/dashboard'
    },
    {
      element: '.tour-step-3',
      popover: { title: t.tour.step3Title, description: t.tour.step3Desc, side: 'bottom', align: 'start' },
      route: '/dashboard'
    },
    {
      element: '.tour-step-4',
      popover: { title: t.tour.step4Title, description: t.tour.step4Desc, side: 'bottom', align: 'start' },
      route: '/metrics'
    },
    {
      element: '.tour-step-5',
      popover: { title: t.tour.step5Title, description: t.tour.step5Desc, side: 'bottom', align: 'start' },
      route: '/scan'
    },
    {
      element: '.tour-step-6',
      popover: { title: t.tour.step6Title, description: t.tour.step6Desc, side: 'bottom', align: 'start' },
      route: '/medications'
    },
    {
      element: '.tour-step-7',
      popover: { title: t.tour.step7Title, description: t.tour.step7Desc, side: 'bottom', align: 'start' },
      route: '/appointments'
    },
    {
      element: '.tour-step-8',
      popover: { title: t.tour.step8Title, description: t.tour.step8Desc, side: 'bottom', align: 'start' },
      route: '/settings'
    }
  ];

  const initDriver = (startIndex) => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      nextBtnText: t.tour.nextBtn,
      prevBtnText: t.tour.prevBtn,
      doneBtnText: t.tour.doneBtn,
      progressText: t.tour.progressText,
      onNextClick: () => {
        const nextIndex = driverObj.getActiveIndex() + 1;
        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex];
          if (location.pathname !== nextStep.route) {
            navigate(nextStep.route);
            driverObj.destroy();
            setTimeout(() => initDriver(nextIndex), 400);
          } else {
            driverObj.moveNext();
          }
        } else {
          driverObj.destroy();
        }
      },
      onPrevClick: () => {
        const prevIndex = driverObj.getActiveIndex() - 1;
        if (prevIndex >= 0) {
          const prevStep = steps[prevIndex];
          if (location.pathname !== prevStep.route) {
            navigate(prevStep.route);
            driverObj.destroy();
            setTimeout(() => initDriver(prevIndex), 400);
          } else {
            driverObj.movePrevious();
          }
        }
      },
      steps: steps.map((step) => ({
        element: step.element,
        popover: step.popover
      }))
    });

    const targetEl = steps[startIndex].element;
    if (document.querySelector(targetEl)) {
      driverObj.drive(startIndex);
    } else {
      setTimeout(() => {
        if (document.querySelector(targetEl)) {
          driverObj.drive(startIndex);
        } else {
            console.warn(`Tour step target not found: ${targetEl}`);
        }
      }, 500);
    }
  };

  const startTour = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      setTimeout(() => initDriver(0), 300);
    } else {
      initDriver(0);
    }
  };

  useEffect(() => {
    if (!user || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') return;

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
      const timer = setTimeout(() => {
        setShowChoice(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);

  const handleChoice = (wantTour) => {
    setShowChoice(false);
    localStorage.setItem('diaplus_has_seen_tour', 'true');
    if (wantTour) {
      startTour();
    }
  };

  return (
    <>
      {showChoice && (
        <Modal title={t.tour.modalTitle} onClose={() => handleChoice(false)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ marginBottom: 20, color: '#444' }}>
              {t.tour.modalDesc}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button 
                onClick={() => handleChoice(false)}
                style={{ padding: '10px 20px', borderRadius: 20, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
              >
                {t.tour.btnSkip}
              </button>
              <button 
                onClick={() => handleChoice(true)}
                style={{ padding: '10px 20px', borderRadius: 20, border: 'none', background: '#1B5FA6', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {t.tour.btnStart}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
