import { useState } from 'react';
import { Check, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '../common/Modal';
import { exportMultipleMedicationsToCalendar } from '../../utils/calendar';

export default function BulkCalendarExportModal({ medications, onClose }) {
  // Only meds that have valid times
  const validMeds = medications.filter(m => m.times && Array.isArray(m.times) && m.times.length > 0);
  
  // Default: all valid meds are checked
  const [selectedIds, setSelectedIds] = useState(
    validMeds.map(m => m.id)
  );

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(v => v !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 loại thuốc');
      return;
    }
    const selectedMeds = validMeds.filter(m => selectedIds.includes(m.id));
    exportMultipleMedicationsToCalendar(selectedMeds);
    onClose();
  };

  if (validMeds.length === 0) {
    return (
      <Modal title="Thêm vào lịch nhắc" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Bạn chưa có đơn thuốc nào có lịch uống.
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Chọn thuốc để nhắc" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Vui lòng chọn những loại thuốc bạn muốn tạo lịch báo thức:
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto', marginBottom: 16 }}>
        {validMeds.map(med => {
          const isSelected = selectedIds.includes(med.id);
          return (
            <div 
              key={med.id}
              onClick={() => handleToggle(med.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: isSelected ? 'rgba(27, 95, 166, 0.05)' : 'var(--color-surface)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {med.name} {med.dosage && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-secondary)' }}>- {med.dosage}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {med.times.join(', ')}
                </div>
              </div>
              
              <div style={{
                width: 20, height: 20,
                borderRadius: 4,
                border: `2px solid ${isSelected ? 'var(--color-primary)' : '#ccc'}`,
                background: isSelected ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isSelected && <Check size={14} color="white" />}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleExport}
        style={{
          width: '100%',
          padding: '14px',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: 15,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <CalendarIcon size={18} /> Lưu vào lịch điện thoại
      </button>
    </Modal>
  );
}
