import { useState } from 'react';
import { User, MapPin, Phone, Calendar, FileText, Pencil, X, Check, Droplets, AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import styles from './UserProfileModal.module.css';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function formatDate(dateStr) {
  if (!dateStr) return 'Chưa cập nhật';
  try { return new Date(dateStr).toLocaleDateString('vi-VN'); } catch { return dateStr; }
}

export default function UserProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    cccd: user?.cccd || '',
    date_of_birth: user?.date_of_birth || '',
    blood_type: user?.blood_type || '',
    allergies: user?.allergies || '',
    insurance_number: user?.insurance_number || '',
    insurance_expiry: user?.insurance_expiry || '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile(form);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      cccd: user?.cccd || '',
      date_of_birth: user?.date_of_birth || '',
      blood_type: user?.blood_type || '',
      allergies: user?.allergies || '',
      insurance_number: user?.insurance_number || '',
      insurance_expiry: user?.insurance_expiry || '',
    });
    setError('');
    setIsEditing(false);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <Modal title="Thông Tin Cá Nhân" onClose={onClose}>
      <div className={styles.profileCard}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.nameSection}>
            <h2 className={styles.name}>{user?.name || 'Chưa cập nhật'}</h2>
            {user?.email && <p className={styles.email}>{user.email}</p>}
          </div>
          {!isEditing && (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
              <Pencil size={15} />
              Chỉnh sửa
            </button>
          )}
        </div>

        <div className={styles.divider} />

        {/* View mode */}
        {!isEditing && (
          <>
            <div className={styles.infoSection}>
              <InfoRow icon={User} label="Họ và Tên" value={user?.name} />
              <InfoRow icon={Phone} label="Số Điện Thoại" value={user?.phone} />
              <InfoRow icon={MapPin} label="Địa Chỉ" value={user?.address} />
              <InfoRow icon={Calendar} label="Ngày Sinh" value={formatDate(user?.date_of_birth)} />
              <InfoRow icon={FileText} label="CCCD/CMT" value={user?.cccd} />
            </div>

            <div className={styles.divider} />

            <div className={styles.bhytSection}>
              <h3 className={styles.bhytTitle}>Thông Tin Y Tế & BHYT</h3>
              <div className={styles.bhytCard}>
                <BhytRow label="Mã BHYT" value={user?.insurance_number} />
                <BhytRow label="Thời Hạn BHYT" value={formatDate(user?.insurance_expiry)} />
                <BhytRow icon={Droplets} label="Nhóm Máu" value={user?.blood_type} highlight />
                <BhytRow icon={AlertTriangle} label="Dị Ứng" value={user?.allergies || 'Không có'} />
              </div>
            </div>
          </>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className={styles.editForm}>
            <div className={styles.editSection}>
              <p className={styles.editSectionTitle}><User size={14} /> Thông tin cơ bản</p>

              <Field label="Họ và Tên" required>
                <input className={styles.input} value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              </Field>
              <Field label="Số Điện Thoại">
                <input className={styles.input} value={form.phone} onChange={set('phone')} placeholder="0901234567" inputMode="tel" />
              </Field>
              <Field label="Địa Chỉ">
                <input className={styles.input} value={form.address} onChange={set('address')} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
              </Field>
              <Field label="CCCD/CMT">
                <input className={styles.input} value={form.cccd} onChange={set('cccd')} placeholder="12 số CCCD" maxLength={12} />
              </Field>
              <Field label="Ngày Sinh">
                <input className={styles.input} type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              </Field>
            </div>

            <div className={styles.editSection}>
              <p className={styles.editSectionTitle}><ShieldCheck size={14} /> Thông tin Y tế & BHYT</p>

              <Field label="Mã BHYT">
                <input className={styles.input} value={form.insurance_number} onChange={set('insurance_number')} placeholder="BH2024001234" />
              </Field>
              <Field label="Ngày hết hạn BHYT">
                <input className={styles.input} type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
              </Field>
              <Field label="Nhóm Máu">
                <div className={styles.bloodTypeGrid}>
                  {BLOOD_TYPES.map(bt => (
                    <button
                      key={bt}
                      type="button"
                      className={`${styles.bloodTypeBtn} ${form.blood_type === bt ? styles.bloodTypeActive : ''}`}
                      onClick={() => setForm(f => ({ ...f, blood_type: f.blood_type === bt ? '' : bt }))}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Dị Ứng">
                <textarea
                  className={styles.textarea}
                  value={form.allergies}
                  onChange={set('allergies')}
                  placeholder="Penicillin, hải sản, phấn hoa,..."
                  rows={2}
                />
              </Field>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                <X size={15} /> Huỷ
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                <Check size={15} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className={styles.infoGroup}>
      <div className={styles.infoLabel}>
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className={styles.infoValue}>{value || 'Chưa cập nhật'}</p>
    </div>
  );
}

function BhytRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className={styles.bhytRow}>
      <span className={styles.bhytLabel}>
        {Icon && <Icon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        {label}
      </span>
      <span className={`${styles.bhytValue} ${highlight ? styles.bhytHighlight : ''}`}>
        {value || 'Chưa cập nhật'}
      </span>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}{required && <span className={styles.required}> *</span>}</label>
      {children}
    </div>
  );
}
