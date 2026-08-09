import { useState } from 'react';
import { Star, Clock, Video, MessageCircle, LockOpen, Phone, ShieldCheck } from 'lucide-react';
import styles from './AppointmentsPage.module.css';

const MOCK_DOCTORS = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    title: 'TS.BS',
    specialty: 'Nội tiết - Đái tháo đường',
    hospital: 'Bệnh viện Đại học Y Dược',
    rating: 4.9,
    reviews: 128,
    isOnline: true,
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=e0f2fe&color=0369a1&size=150',
    tags: ['Chuyên gia', 'Nhiệt tình']
  },
  {
    id: 2,
    name: 'Lê Hoàng Minh B',
    title: 'BS.CKII',
    specialty: 'Tim mạch - Nội tiết',
    hospital: 'Bệnh viện Chợ Rẫy',
    rating: 4.8,
    reviews: 95,
    isOnline: false,
    avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Minh+B&background=fef08a&color=854d0e&size=150',
    tags: ['Kinh nghiệm 15 năm']
  },
  {
    id: 3,
    name: 'Phạm Thị C',
    title: 'ThS.BS',
    specialty: 'Dinh dưỡng lâm sàng',
    hospital: 'Bệnh viện Nguyễn Tri Phương',
    rating: 5.0,
    reviews: 210,
    isOnline: true,
    avatar: 'https://ui-avatars.com/api/?name=Pham+Thi+C&background=dcfce7&color=166534&size=150',
    tags: ['Tư vấn thực đơn', 'Nhẹ nhàng']
  },
  {
    id: 4,
    name: 'Trần Đại D',
    title: 'BS.CKI',
    specialty: 'Lão khoa - Đái tháo đường',
    hospital: 'Bệnh viện Thống Nhất',
    rating: 4.7,
    reviews: 64,
    isOnline: false,
    avatar: 'https://ui-avatars.com/api/?name=Tran+Dai+D&background=f3e8ff&color=6b21a8&size=150',
    tags: ['Khám người cao tuổi']
  }
];

export default function AppointmentsPage() {
  const [unlockingId, setUnlockingId] = useState(null);

  const handleUnlock = (doc) => {
    setUnlockingId(doc.id);
    setTimeout(() => {
      alert(`Đã mở khóa kết nối với ${doc.title} ${doc.name}! Tính năng Call/Chat đang trong quá trình phát triển.`);
      setUnlockingId(null);
    }, 1200);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} tour-step-7`}>Bác sĩ & Chuyên gia</h1>
          <p className={styles.subtitle}>Kết nối trực tuyến với các chuyên gia y tế hàng đầu về Đái tháo đường.</p>
        </div>
      </div>

      <div className={styles.banner}>
        <ShieldCheck size={20} className={styles.bannerIcon} />
        <span>100% Bác sĩ được xác thực chuyên môn & chứng chỉ hành nghề.</span>
      </div>

      <div className={styles.list}>
        {MOCK_DOCTORS.map((doc) => (
          <div key={doc.id} className={styles.doctorCard}>
            <div className={styles.cardHeader}>
              <div className={styles.avatarWrap}>
                <img src={doc.avatar} alt={doc.name} className={styles.avatar} />
                <div className={`${styles.statusDot} ${doc.isOnline ? styles.online : styles.busy}`}></div>
              </div>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.titleText}>{doc.title}</span>
                  <span className={styles.nameText}>{doc.name}</span>
                </div>
                <div className={styles.specialty}>{doc.specialty}</div>
                <div className={styles.hospital}>{doc.hospital}</div>
                
                <div className={styles.statsRow}>
                  <div className={styles.rating}>
                    <Star size={14} fill="#eab308" color="#eab308" />
                    <span>{doc.rating}</span>
                    <span className={styles.reviews}>({doc.reviews} lượt)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tags}>
              {doc.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.serviceBadge}>
              <div className={styles.serviceIcons}>
                <Phone size={14} />
                <MessageCircle size={14} />
                <Video size={14} />
              </div>
              <span>Call / Chat trong 30 phút</span>
            </div>

            <button 
              className={`${styles.unlockBtn} ${unlockingId === doc.id ? styles.unlocking : ''}`}
              onClick={() => handleUnlock(doc)}
              disabled={unlockingId === doc.id}
            >
              {unlockingId === doc.id ? (
                <span className={styles.loader}></span>
              ) : (
                <>
                  <LockOpen size={16} strokeWidth={2.5} />
                  <span>Mở khóa (Unlock)</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
