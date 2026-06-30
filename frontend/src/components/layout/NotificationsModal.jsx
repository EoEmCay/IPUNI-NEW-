import { X, Bell, Pill, Calendar } from 'lucide-react';
import ReactDOM from 'react-dom';
import styles from './NotificationsModal.module.css';

export default function NotificationsModal({ isOpen, onClose, medications, appointments, hasNotifications }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Thông báo</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {!hasNotifications ? (
            <div className={styles.emptyState}>
              <Bell size={48} />
              <p>Chưa có thông báo gì hết</p>
            </div>
          ) : (
            <>
              {medications.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <Pill size={16} /> Thuốc cần uống
                  </h3>
                  <div className={styles.list}>
                    {medications.map(med => (
                      <div key={med.id} className={styles.notificationItem}>
                        <div className={styles.icon}>
                          <Pill size={20} />
                        </div>
                        <div className={styles.info}>
                          <p className={styles.title}>{med.name}</p>
                          <p className={styles.detail}>{med.dosage}</p>
                          <p className={styles.times}>
                            {med.times && typeof med.times === 'string'
                              ? JSON.parse(med.times).join(', ')
                              : med.times?.join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {appointments.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <Calendar size={16} /> Lịch hẹn bác sĩ
                  </h3>
                  <div className={styles.list}>
                    {appointments.map(appt => (
                      <div key={appt.id} className={styles.notificationItem}>
                        <div className={styles.icon}>
                          <Calendar size={20} />
                        </div>
                        <div className={styles.info}>
                          <p className={styles.title}>{appt.doctor_name}</p>
                          <p className={styles.detail}>{appt.department}</p>
                          <p className={styles.time}>
                            {new Date(appt.scheduled_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
