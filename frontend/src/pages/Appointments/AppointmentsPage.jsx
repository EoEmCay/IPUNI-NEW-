import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope, Camera, ArrowRight } from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import styles from './AppointmentsPage.module.css';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScannedDoctors = async () => {
      try {
        const res = await appointmentsService.getAll();
        const appointments = res.data?.data || [];
        
        // Trích xuất CHỈ CÁC BÁC SĨ THẬT từ đơn thuốc đã quét (có trong danh sách appointments)
        const scannedDoctors = [];
        const seenNames = new Set();

        appointments.forEach(app => {
          if (app.doctor_name && 
              app.doctor_name !== 'Không rõ bác sĩ' && 
              app.doctor_name !== 'Bác sĩ (Tái khám)' &&
              !app.doctor_name.toLowerCase().includes('không rõ')) {
            const nameLower = app.doctor_name.toLowerCase();
            if (!seenNames.has(nameLower)) {
              seenNames.add(nameLower);
              
              let title = 'Bác sĩ';
              let cleanName = app.doctor_name;
              
              if (cleanName.toLowerCase().startsWith('bs. ') || cleanName.toLowerCase().startsWith('bs ')) {
                title = 'BS.';
                cleanName = cleanName.substring(3).trim();
              } else if (cleanName.toLowerCase().startsWith('th.s ')) {
                title = 'ThS.BS';
                cleanName = cleanName.substring(5).trim();
              } else if (cleanName.toLowerCase().startsWith('ts.bs ')) {
                title = 'TS.BS';
                cleanName = cleanName.substring(6).trim();
              }

              scannedDoctors.push({
                id: `scanned-${app.id || Math.random()}`,
                name: cleanName,
                title: title,
                specialty: 'Bác sĩ điều trị',
                hospital: 'Theo đơn thuốc đã quét',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1B5FA6&color=fff&size=150`,
                tags: ['Bác sĩ điều trị', 'Từ đơn thuốc đã quét'],
                notes: app.note || 'Theo dõi chỉ số đái tháo đường và tái khám theo chỉ định.',
                scheduled_at: app.scheduled_at
              });
            }
          }
        });

        // Chỉ hiển thị bác sĩ từ đơn thuốc thật, KHÔNG chứa bác sĩ ảo
        setDoctors(scannedDoctors);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bác sĩ từ đơn thuốc', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScannedDoctors();
  }, []);

  const handleDoctorClick = useCallback((doc) => {
    navigate(`/doctor/${encodeURIComponent(doc.name)}`, { state: { doctor: doc } });
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} tour-step-7`}>Bác sĩ & Lời dặn</h1>
          <p className={styles.subtitle}>Thông tin bác sĩ điều trị và lời dặn trích xuất từ các đơn thuốc đã quét của bạn.</p>
        </div>
      </div>

      <div className={styles.banner}>
        <ShieldCheck size={20} className={styles.bannerIcon} />
        <span>Danh sách tự động cập nhật Bác sĩ điều trị & Lời dặn ngay khi bạn chụp đơn thuốc.</span>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>Đang tải thông tin bác sĩ từ đơn thuốc...</div>
        ) : doctors.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Stethoscope size={32} />
            </div>

            <div className={styles.emptyStateText}>
              <h3 className={styles.emptyStateTitle}>Chưa có Bác sĩ từ đơn thuốc</h3>
              <p className={styles.emptyStateDesc}>
                Hãy quét/chụp ảnh đơn thuốc của bạn. Trợ lý AI DIA+ sẽ tự động nhận diện thông tin Bác sĩ điều trị và Lời dặn dặn dò tại đây.
              </p>
            </div>

            <button className={styles.emptyStateBtn} onClick={() => navigate('/scan')}>
              <Camera size={18} />
              <span>Quét đơn thuốc ngay</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          doctors.map((doc) => (
            <div key={doc.id} className={styles.mockupDoctorCard} onClick={() => handleDoctorClick(doc)}>
              <div className={styles.mockupDoctorTop}>
                <div className={styles.avatarWrap}>
                  <img src={doc.avatar} alt={doc.name} className={styles.mockupDoctorAvatar} />
                  <div className={`${styles.statusDot} ${styles.online}`}></div>
                </div>
                <div className={styles.mockupDoctorInfo}>
                  <div className={styles.mockupDoctorName}>
                    {doc.title ? `${doc.title} ` : ''}{doc.name}
                  </div>
                  <div className={styles.mockupDoctorSub}>
                    {doc.specialty} | {doc.hospital}
                  </div>
                  {doc.notes && (
                    <div className={styles.doctorNotes}>
                      <strong>Lời dặn:</strong> {doc.notes}
                    </div>
                  )}
                </div>
              </div>
              <button className={styles.fullWidthBookBtn} onClick={(e) => { e.stopPropagation(); handleDoctorClick(doc); }}>
                Xem chi tiết & Lịch tái khám
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
