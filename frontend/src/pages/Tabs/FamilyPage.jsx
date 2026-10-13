import React from 'react';
import FamilyCard from '../../components/settings/FamilyCard';
import TelegramCard from '../../components/settings/TelegramCard';
import CareTimeline from '../../components/care/CareTimeline';
import styles from './TabPages.module.css';

// Tab Gia đình: Đồng hành cùng người thân với Dòng thời gian Live & Kết nối cảnh báo
export default function FamilyPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Gia đình &amp; Chăm sóc</h1>
      <p className={styles.subtitle}>Theo dõi trực tiếp cữ thuốc và chỉ số đường huyết trong ngày của người thân.</p>

      {/* Dòng thời gian chăm sóc trực tiếp (Grab-like Live Care Timeline) */}
      <CareTimeline />

      {/* Cài đặt kết nối người nhà & Telegram cảnh báo khẩn */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0 0 0', color: '#374151' }}>
          Kết nối &amp; Nhận cảnh báo
        </h2>
        <FamilyCard />
        <TelegramCard />
      </div>
    </div>
  );
}
