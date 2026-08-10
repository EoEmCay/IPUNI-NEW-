import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Video, MessageCircle, Phone, ShieldCheck, ChevronRight } from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import styles from './AppointmentsPage.module.css';

const DEFAULT_DOCTORS = [
  {
    id: 'dia-plus',
    name: 'Bác sĩ DIA+',
    title: 'Chuyên gia AI',
    specialty: 'Đái tháo đường & Dinh dưỡng',
    hospital: 'DIA+ Health Center',
    rating: 5.0,
    reviews: 1250,
    isOnline: true,
    avatar: 'https://ui-avatars.com/api/?name=DIA%2B&background=1B5FA6&color=fff&size=150',
    tags: ['Tư vấn 24/7', 'Phân tích chỉ số', 'Gợi ý thực đơn']
  },
  {
    id: 'mock-1',
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
    id: 'mock-2',
    name: 'Lê Hoàng Minh B',
    title: 'BS.CKII',
    specialty: 'Tim mạch - Nội tiết',
    hospital: 'Bệnh viện Chợ Rẫy',
    rating: 4.8,
    reviews: 95,
    isOnline: false,
    avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Minh+B&background=fef08a&color=854d0e&size=150',
    tags: ['Kinh nghiệm 15 năm']
  }
];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState(DEFAULT_DOCTORS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScannedDoctors = async () => {
      try {
        const res = await appointmentsService.getAll();
        const appointments = res.data?.data || [];
        
        // Trích xuất các bác sĩ từ đơn thuốc đã quét (có trong danh sách appointments)
        const scannedDoctors = [];
        const seenNames = new Set();
        
        // Thêm tên của các bác sĩ mặc định vào Set để tránh trùng lặp nếu AI quét nhầm ra tên này
        DEFAULT_DOCTORS.forEach(d => seenNames.add(d.name.toLowerCase()));

        appointments.forEach(app => {
          if (app.doctor_name && app.doctor_name !== 'Không rõ bác sĩ' && app.doctor_name !== 'Bác sĩ (Tái khám)') {
            const nameLower = app.doctor_name.toLowerCase();
            if (!seenNames.has(nameLower)) {
              seenNames.add(nameLower);
              // Phân tách title và name nếu có (vd: BS. Nguyễn Văn A)
              let title = 'Bác sĩ';
              let cleanName = app.doctor_name;
              
              if (cleanName.toLowerCase().startsWith('bs. ') || cleanName.toLowerCase().startsWith('bs ')) {
                title = 'BS.';
                cleanName = cleanName.substring(3).trim();
              } else if (cleanName.toLowerCase().startsWith('th.s ')) {
                title = 'ThS.BS';
                cleanName = cleanName.substring(5).trim();
              }

              scannedDoctors.push({
                id: `scanned-${app.id || Math.random()}`,
                name: cleanName,
                title: title,
                specialty: 'Bác sĩ điều trị', // Mặc định vì từ đơn thuốc
                hospital: 'Theo đơn thuốc đã quét',
                rating: 4.5,
                reviews: Math.floor(Math.random() * 50) + 1,
                isOnline: Math.random() > 0.5,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=f3f4f6&color=4b5563&size=150`,
                tags: ['Bác sĩ của bạn', 'Từ đơn thuốc']
              });
            }
          }
        });

        // Hợp nhất danh sách bác sĩ mặc định và bác sĩ được quét ra từ đơn thuốc
        setDoctors([...DEFAULT_DOCTORS, ...scannedDoctors]);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bác sĩ đã lưu', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScannedDoctors();
  }, []);

  const handleDoctorClick = useCallback((doc) => {
    // Chuyển hướng sang trang Profile của bác sĩ, truyền thông tin qua state
    navigate(`/doctor/${encodeURIComponent(doc.name)}`, { state: { doctor: doc } });
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} tour-step-7`}>Chuyên gia & Bác sĩ</h1>
          <p className={styles.subtitle}>Kết nối trực tuyến với các chuyên gia y tế và bác sĩ điều trị của bạn.</p>
        </div>
      </div>

      <div className={styles.banner}>
        <ShieldCheck size={20} className={styles.bannerIcon} />
        <span>Hệ thống bao gồm các bác sĩ bạn đã quét từ đơn thuốc và các chuyên gia từ DIA+.</span>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>Đang tải danh sách bác sĩ...</div>
        ) : (
          doctors.map((doc) => (
            <div key={doc.id} className={styles.doctorCard} onClick={() => handleDoctorClick(doc)}>
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
                  
                  <div className={styles.actionsRow}>
                    <div className={styles.rating}>
                      <Star size={14} fill="#eab308" color="#eab308" />
                      <span>{doc.rating}</span>
                    </div>
                    <div className={styles.quickIcons}>
                      <div className={styles.iconBtn}><Phone size={14} /></div>
                      <div className={styles.iconBtn}><Video size={14} /></div>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className={styles.chevron} color="#9ca3af" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
