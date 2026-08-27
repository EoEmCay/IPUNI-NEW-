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
            <select 
              name="frequency" 
              value={formData.frequency} 
              onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 14, background: 'white' }}
              required 
            >
              <option value="1 lần/ngày">1 lần/ngày (Hàng ngày)</option>
              <option value="2 lần/ngày">2 lần/ngày (Sáng & Tối)</option>
              <option value="3 lần/ngày">3 lần/ngày (Sáng, Trưa & Tối)</option>
              <option value="Cách ngày (2 ngày 1 lần)">📅 Cách ngày (2 ngày 1 lần)</option>
              <option value="Thứ 2, 4, 6">📅 Lịch Thứ 2, 4, 6</option>
              <option value="Thứ 3, 5, 7">📅 Lịch Thứ 3, 5, 7</option>
              <option value="Khi cần">Khi cần thiết</option>
            </select>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Giờ nhắc uống</label>
            <span style={{ fontSize: 11, color: '#64748B' }}>Bấm chọn nhanh buổi:</span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[
              { label: '🌅 Sáng', time: '07:00' },
              { label: '☀️ Trưa', time: '11:30' },
              { label: '🌆 Chiều', time: '15:30' },
              { label: '🌙 Tối', time: '18:30' },
              { label: '🛌 Trước ngủ', time: '21:30' }
            ].map((p, idx) => {
              const timesArr = formData.times.split(',').map(s => s.trim()).filter(Boolean);
              const isSelected = timesArr.includes(p.time);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    let nextArr = [...timesArr];
                    if (isSelected) {
                      nextArr = nextArr.filter(t => t !== p.time);
                    } else {
                      nextArr.push(p.time);
                      nextArr.sort();
                    }
                    setFormData(prev => ({ ...prev, times: nextArr.join(', ') }));
                  }}
                  style={{
                    fontSize: 11.5,
                    padding: '4px 9px',
                    borderRadius: 6,
                    border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid #CBD5E1',
                    background: isSelected ? '#EFF6FF' : 'white',
                    color: isSelected ? '#1D4ED8' : '#475569',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {p.label} ({p.time})
                </button>
              );
            })}
          </div>

          <input 
            type="text" name="times" 
            value={formData.times} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: 15 }} 
            placeholder="VD: 07:00, 18:00" 
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
