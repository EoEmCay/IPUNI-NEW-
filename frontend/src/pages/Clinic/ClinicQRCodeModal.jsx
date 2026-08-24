import { X, Printer, Copy, Check, QrCode, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import styles from './ClinicDashboardPage.module.css';

export default function ClinicQRCodeModal({ clinicProfile, onClose }) {
  const [copied, setCopied] = useState(false);

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    clinicProfile?.qrCodeValue || JSON.stringify({ type: 'DIAPLUS_CLINIC_CHECKIN', clinicId: clinicProfile?.id })
  )}&margin=15`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://diaplus.vn/scan?clinicId=${clinicProfile?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.qrModalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Mã QR Check-in Phòng Khám
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
              Đặt tại Bàn khám hoặc Quầy lễ tân để bệnh nhân quét bằng App DIA+
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Stand Card */}
        <div className={styles.printableStand}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px' }}>
              DIA<span style={{ color: '#ef4444' }}>+</span> CLINIC CONNECT
            </div>
            <h3 style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              {clinicProfile?.name}
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
              Bác sĩ phụ trách: <strong>{clinicProfile?.doctorName}</strong> ({clinicProfile?.doctorTitle})
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', background: '#ffffff', borderRadius: '16px', border: '2px dashed #0284c7', margin: '0 auto', width: '220px' }}>
            <img 
              src={qrDataUrl} 
              alt="Mã QR Phòng Khám" 
              style={{ width: '190px', height: '190px', objectFit: 'contain' }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700' }}>
              <QrCode size={16} /> Mở App DIA+ ➔ Quét mã để liên kết điều trị
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '8px' }}>
              Mã phòng khám: <strong>{clinicProfile?.id}</strong> • Bảo mật dữ liệu y tế theo chuẩn HIPAA
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={handlePrint}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            <Printer size={18} /> In mã đặt tại bàn khám
          </button>

          <button 
            onClick={handleCopyLink}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', borderRadius: '12px', background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            {copied ? <Check size={18} color="#16a34a" /> : <Copy size={18} />}
            <span>{copied ? 'Đã chép' : 'Sao chép link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
