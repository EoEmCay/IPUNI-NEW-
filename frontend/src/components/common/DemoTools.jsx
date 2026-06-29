import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { useToast } from '../../hooks/useToast';

export default function DemoTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const triggerMed = () => {
    voiceAlertService.playAlert(ALERT_TYPES.MED_MORNING);
    showToast('Đã đến giờ uống thuốc: Thuốc Demo 1, Thuốc Demo 2', 'success');
  };

  const triggerSugarHigh = () => {
    voiceAlertService.playAlert(ALERT_TYPES.SUGAR_HIGH);
    showToast('Đường huyết đang TĂNG!', 'error');
  };

  const triggerSugarLow = () => {
    voiceAlertService.playAlert(ALERT_TYPES.SUGAR_LOW);
    showToast('Đường huyết đang GIẢM!', 'error');
  };

  const triggerBPLow = () => {
    voiceAlertService.playAlert(ALERT_TYPES.BP_LOW);
    showToast('Huyết áp đang THẤP!', 'error');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          cursor: 'pointer'
        }}
      >
        <Bug size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 20,
      background: 'white',
      padding: 16,
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      zIndex: 9999,
      width: 250,
      border: '2px solid #ff4444'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ color: '#ff4444' }}>Demo Tools</strong>
        <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={triggerMed} style={btnStyle}>Giả lập tới giờ thuốc</button>
        <button onClick={triggerSugarHigh} style={btnStyle}>Giả lập Đường huyết TĂNG</button>
        <button onClick={triggerSugarLow} style={btnStyle}>Giả lập Đường huyết GIẢM</button>
        <button onClick={triggerBPLow} style={btnStyle}>Giả lập Tụt Huyết Áp</button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '8px 12px',
  background: '#f0f0f0',
  border: '1px solid #ccc',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'left'
};
