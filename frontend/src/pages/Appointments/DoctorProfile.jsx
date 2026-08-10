import { useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Heart, Star, Phone, Video, MessageSquare } from 'lucide-react';
import styles from './DoctorProfile.module.css';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const doc = state?.doctor || {
    name: decodeURIComponent(id || 'Bác sĩ DIA+'),
    title: 'Chuyên gia',
    specialty: 'Đái tháo đường & Dinh dưỡng',
    hospital: 'DIA+ Health Center',
    rating: 5.0,
    reviews: 1250,
    isOnline: true,
    avatar: 'https://ui-avatars.com/api/?name=DIA%2B&background=1B5FA6&color=fff&size=150',
    tags: ['Tư vấn 24/7', 'Phân tích chỉ số', 'Gợi ý thực đơn']
  };

  const handleAudioCall = useCallback(() => {
    navigate(`/call/${encodeURIComponent(doc.name)}`, { state: { doctor: doc, mode: 'audio' } });
  }, [navigate, doc]);

  const handleVideoCall = useCallback(() => {
    navigate(`/call/${encodeURIComponent(doc.name)}`, { state: { doctor: doc, mode: 'video' } });
  }, [navigate, doc]);

  const handleMessage = useCallback(() => {
    navigate('/advice', { state: { doctor: doc } });
  }, [navigate, doc]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      {/* Top blue section */}
      <div className={styles.headerArea}>
        <div className={styles.topNav}>
          <button onClick={handleBack} className={styles.iconBtn}>
            <ChevronLeft size={24} color="#fff" />
          </button>
          <span className={styles.navTitle}>Thông tin Bác sĩ</span>
          <div className={styles.rightIcons}>
            <Search size={20} color="#fff" />
            <Heart size={20} color="#fff" />
          </div>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.pulseBg}></div>
          <img src={doc.avatar} alt={doc.name} className={styles.largeAvatar} />
        </div>
      </div>

      {/* Bottom white card */}
      <div className={styles.bottomCard}>
        <div className={styles.dragHandle}></div>
        
        <div className={styles.nameHeader}>
          <div>
            <h1 className={styles.docName}>{doc.title} {doc.name}</h1>
            <p className={styles.docSub}>{doc.specialty} | {doc.hospital}</p>
          </div>
          <div className={styles.ratingBadge}>
            <span>{doc.rating}</span>
            <Star size={14} fill="#eab308" color="#eab308" />
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>15yr</span>
            <span className={styles.statLabel}>Kinh nghiệm</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{doc.reviews}+</span>
            <span className={styles.statLabel}>Đã điều trị</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>Miễn phí</span>
            <span className={styles.statLabel}>Chi phí gọi</span>
          </div>
        </div>

        <div className={styles.scheduleSection}>
          <h3>Chọn Ngày (Select Date)</h3>
          <div className={styles.datePicker}>
            <select className={styles.selectBox} defaultValue="today">
              <option value="today">Hôm nay</option>
              <option value="tomorrow">Ngày mai</option>
            </select>
            <select className={styles.selectBox} defaultValue="current">
              <option value="current">Tháng này</option>
            </select>
          </div>

          <h3>Giờ rảnh (Schedules)</h3>
          <div className={styles.timeSlots}>
            <div className={`${styles.timeSlot} ${styles.activeSlot}`}>Ngay bây giờ</div>
            <div className={styles.timeSlot}>10:30 - 11:30</div>
            <div className={styles.timeSlot}>14:30 - 15:30</div>
            <div className={styles.timeSlot}>19:30 - 20:30</div>
          </div>
        </div>

        <div className={styles.footerAction}>
          <button className={styles.audioBtn} onClick={handleAudioCall}>
            <Phone size={16} fill="currentColor" /> Gọi thường
          </button>
          <button className={styles.videoBtn} onClick={handleVideoCall}>
            <Video size={16} fill="currentColor" /> Video Call
          </button>
          <button className={styles.msgBtn} onClick={handleMessage}>
            <MessageSquare size={16} fill="currentColor" /> Nhắn tin
          </button>
        </div>
      </div>
    </div>
  );
}
