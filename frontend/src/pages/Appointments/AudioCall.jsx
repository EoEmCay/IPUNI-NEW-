import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Volume2, Video, MicOff, PhoneOff } from 'lucide-react';
import styles from './AudioCall.module.css';

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min`;
};

export default function AudioCall() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const doc = state?.doctor || {
    name: decodeURIComponent(id || 'Bác sĩ DIA+'),
    avatar: 'https://ui-avatars.com/api/?name=DIA%2B&background=1B5FA6&color=fff&size=150',
  };

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEndCall = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <button onClick={handleEndCall} className={styles.iconBtn}>
          <ChevronLeft size={24} color="#fff" />
        </button>
        <span className={styles.navTitle}>Audio Call</span>
        <div style={{ width: 24 }}></div>
      </div>

      <div className={styles.centerContent}>
        <div className={styles.avatarWrap}>
          <div className={styles.pulse1}></div>
          <div className={styles.pulse2}></div>
          <img src={doc.avatar} alt={doc.name} className={styles.avatar} />
        </div>
        <h2 className={styles.name}>{doc.name}</h2>
        <p className={styles.timer}>{formatTime(seconds)}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <button className={styles.actionBtn}>
            <Volume2 size={24} />
          </button>
          <button className={styles.actionBtn}>
            <Video size={24} />
          </button>
          <button className={styles.actionBtn}>
            <MicOff size={24} />
          </button>
        </div>
        <button className={styles.endCallBtn} onClick={handleEndCall}>
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
