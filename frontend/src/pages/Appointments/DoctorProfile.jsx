import { useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Heart, Star, Calendar, MessageSquare, Stethoscope, CheckCircle2, FileText } from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import { useToast } from '../../hooks/useToast';
import styles from './DoctorProfile.module.css';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();
  const { showToast } = useToast();

  const [selectedSlot, setSelectedSlot] = useState('09:00');
  const [selectedDate, setSelectedDate] = useState('today');
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const doc = state?.doctor || {
    name: decodeURIComponent(id || 'Bác sĩ DIA+'),
    title: 'Chuyên gia',
    specialty: 'Đái tháo đường & Dinh dưỡng',
    hospital: 'DIA+ Health Center',
    rating: 5.0,
    reviews: 1250,
    isOnline: true,
    avatar: 'https://ui-avatars.com/api/?name=DIA%2B&background=1B5FA6&color=fff&size=150',
    tags: ['Tư vấn 24/7', 'Phân tích chỉ số', 'Gợi ý thực đơn'],
    notes: 'Tiếp tục theo dõi đường huyết đói hàng ngày, uống thuốc đúng giờ sau bữa ăn.'
  };

  const handleBookAppointment = useCallback(async () => {
    setIsBooking(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await appointmentsService.create({
        doctor_name: `${doc.title ? doc.title + ' ' : ''}${doc.name}`,
        scheduled_at: `${todayStr} ${selectedSlot}`,
        note: `Lịch tái khám với ${doc.name} (${selectedSlot})`,
        status: 'upcoming'
      });
      setBookedSuccess(true);
      showToast(`Đã đặt lịch tái khám với ${doc.title || ''} ${doc.name} thành công!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi khi đặt lịch tái khám', 'error');
    } finally {
      setIsBooking(false);
    }
  }, [doc, selectedSlot, showToast]);

  const handleMessage = useCallback(() => {
    navigate('/advice', { state: { doctor: doc } });
  }, [navigate, doc]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      {/* Top header section */}
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

      {/* Bottom info card */}
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
            <span className={styles.statVal}>15 năm</span>
            <span className={styles.statLabel}>Kinh nghiệm</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{doc.reviews}+</span>
            <span className={styles.statLabel}>Đơn thuốc</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>Chuyên khoa</span>
            <span className={styles.statLabel}>Nội tiết</span>
          </div>
        </div>

        {/* Lời dặn từ đơn thuốc / Bác sĩ */}
        <div className={styles.notesBox} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary)', fontWeight: '700', fontSize: '15px' }}>
            <Stethoscope size={18} />
            <span>Lời dặn của Bác sĩ (Chỉ dẫn điều trị)</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: 0 }}>
            {doc.notes || 'Theo dõi đường huyết định kỳ, uống thuốc đúng liều và tuân thủ chế độ ăn giảm bớt tinh bột.'}
          </p>
        </div>

        <div className={styles.scheduleSection}>
          <h3>Chọn Ngày Tái Khám</h3>
          <div className={styles.datePicker}>
            <select className={styles.selectBox} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              <option value="today">Hôm nay</option>
              <option value="tomorrow">Ngày mai</option>
              <option value="next_week">Tuần sau</option>
            </select>
          </div>

          <h3>Khung Giờ Hẹn Khám</h3>
          <div className={styles.timeSlots}>
            {['08:30', '09:30', '10:30', '14:30', '16:00', '19:30'].map((slot) => (
              <div
                key={slot}
                className={`${styles.timeSlot} ${selectedSlot === slot ? styles.activeSlot : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footerAction} style={{ gap: '10px' }}>
          <button
            className={styles.videoBtn}
            style={{ flex: 2, background: bookedSuccess ? '#10B981' : 'var(--color-primary)' }}
            onClick={handleBookAppointment}
            disabled={isBooking}
          >
            {bookedSuccess ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
            <span>{bookedSuccess ? 'Đã Đặt Lịch Tái Khám' : 'Đặt Lịch Tái Khám'}</span>
          </button>
          
          <button className={styles.msgBtn} style={{ flex: 1 }} onClick={handleMessage}>
            <MessageSquare size={18} />
            <span>Hỏi Bác Sĩ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
