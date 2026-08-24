import { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import { clinicService } from '../../pages/Clinic/clinicService';

export default function ClinicActiveBadge() {
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    const checkSession = () => {
      setActiveSession(clinicService.getActivePatientClinicSession());
    };
    checkSession();

    window.addEventListener('clinicSessionChanged', checkSession);
    return () => window.removeEventListener('clinicSessionChanged', checkSession);
  }, []);

  if (!activeSession) return null;

  const handleLeave = () => {
    if (window.confirm(`Bạn có chắc muốn kết thúc đợt khám tại ${activeSession.clinicName}?`)) {
      clinicService.patientLeaveClinic();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
      color: '#ffffff',
      padding: '8px 14px',
      fontSize: '12.5px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
      position: 'relative',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: '#ffffff', color: '#0284c7', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
          🏥
        </div>
        <div>
          <span>Đang điều trị: <strong>{activeSession.clinicName}</strong></span>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Bác sĩ phụ trách: {activeSession.doctorName}</div>
        </div>
      </div>

      <button
        onClick={handleLeave}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '11.5px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <LogOut size={13} /> Rời phòng khám
      </button>
    </div>
  );
}
