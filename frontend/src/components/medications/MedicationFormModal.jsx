import { useState } from 'react';
import Modal from '../common/Modal';
import { medicationsService } from '../../services/medications.service';

export default function MedicationFormModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '1 lần/ngày',
    times: '08:00',
    instructions: 'Uống sau ăn'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('Vui lòng nhập tên thuốc');
    
    setLoading(true);
    try {
      const timesArray = formData.times.split(',').map(t => t.trim()).filter(Boolean);
      await medicationsService.create({
        ...formData,
        times: timesArray.length > 0 ? timesArray : ['08:00']
      });
      onSuccess();
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Thêm thuốc mới" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Tên thuốc</label>
          <input 
            type="text" name="name" 
            value={formData.name} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
            placeholder="VD: Glucophage" 
            required 
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Liều lượng</label>
            <input 
              type="text" name="dosage" 
              value={formData.dosage} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
              placeholder="VD: 500mg" 
              required 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Tần suất</label>
            <input 
              type="text" name="frequency" 
              value={formData.frequency} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
              required 
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Giờ nhắc uống (Cách nhau dấu phẩy)</label>
          <input 
            type="text" name="times" 
            value={formData.times} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
            placeholder="VD: 08:00, 20:00" 
            required 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Lời dặn</label>
          <input 
            type="text" name="instructions" 
            value={formData.instructions} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '14px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: 15,
            fontWeight: 700,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Đang lưu...' : 'Lưu vào lịch'}
        </button>
      </form>
    </Modal>
  );
}
