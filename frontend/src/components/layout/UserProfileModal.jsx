import { useState } from 'react';
import { User, MapPin, Phone, Calendar, FileText, Pencil, X, Check, Droplets, AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useT } from '../../hooks/useT';
import styles from './UserProfileModal.module.css';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function formatDate(dateStr, notUpdatedText) {
  if (!dateStr) return notUpdatedText;
  try { return new Date(dateStr).toLocaleDateString('vi-VN'); } catch { return dateStr; }
}

export default function UserProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const t = useT();
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
      setError(err.response?.data?.message || t.profile.saveError);
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
    <Modal title={t.profile.title} onClose={onClose}>
      <div className={styles.profileCard}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.nameSection}>
            <h2 className={styles.name}>{user?.name || t.profile.notUpdated}</h2>
            {user?.email && <p className={styles.email}>{user.email}</p>}
          </div>
          {!isEditing && (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
              <Pencil size={15} />
              {t.profile.edit}
            </button>
          )}
        </div>

        <div className={styles.divider} />

        {/* View mode */}
        {!isEditing && (
          <>
            <div className={styles.infoSection}>
              <InfoRow icon={User} label={t.profile.fullName} value={user?.name} t={t} />
              <InfoRow icon={Phone} label={t.profile.phone} value={user?.phone} t={t} />
              <InfoRow icon={MapPin} label={t.profile.address} value={user?.address} t={t} />
              <InfoRow icon={Calendar} label={t.profile.dob} value={formatDate(user?.date_of_birth, t.profile.notUpdated)} t={t} />
              <InfoRow icon={FileText} label={t.profile.idCard} value={user?.cccd} t={t} />
            </div>

            <div className={styles.divider} />

            <div className={styles.bhytSection}>
              <h3 className={styles.bhytTitle}>{t.profile.medicalInfo}</h3>
              <div className={styles.bhytCard}>
                <BhytRow label={t.profile.insuranceNo} value={user?.insurance_number} t={t} />
                <BhytRow label={t.profile.insuranceExp} value={formatDate(user?.insurance_expiry, t.profile.notUpdated)} t={t} />
                <BhytRow icon={Droplets} label={t.profile.bloodType} value={user?.blood_type} highlight t={t} />
                <BhytRow icon={AlertTriangle} label={t.profile.allergies} value={user?.allergies || t.profile.none} t={t} />
              </div>
            </div>
          </>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className={styles.editForm}>
            <div className={styles.editSection}>
              <p className={styles.editSectionTitle}><User size={14} /> {t.profile.basicInfo}</p>

              <Field label={t.profile.fullName} required>
                <input className={styles.input} value={form.name} onChange={set('name')} placeholder={t.profile.placeholderName} />
              </Field>
              <Field label={t.profile.phone}>
                <input className={styles.input} value={form.phone} onChange={set('phone')} placeholder="0901234567" inputMode="tel" />
              </Field>
              <Field label={t.profile.address}>
                <input className={styles.input} value={form.address} onChange={set('address')} placeholder={t.profile.placeholderAddress} />
              </Field>
              <Field label={t.profile.idCard}>
                <input className={styles.input} value={form.cccd} onChange={set('cccd')} placeholder={t.profile.placeholderId} maxLength={12} />
              </Field>
              <Field label={t.profile.dob}>
                <input className={styles.input} type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              </Field>
            </div>

            <div className={styles.editSection}>
              <p className={styles.editSectionTitle}><ShieldCheck size={14} /> {t.profile.medicalInfo}</p>

              <Field label={t.profile.insuranceNo}>
                <input className={styles.input} value={form.insurance_number} onChange={set('insurance_number')} placeholder={t.profile.placeholderInsurance} />
              </Field>
              <Field label={t.profile.insuranceExp}>
                <input className={styles.input} type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
              </Field>
              <Field label={t.profile.bloodType}>
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
              <Field label={t.profile.allergies}>
                <textarea
                  className={styles.textarea}
                  value={form.allergies}
                  onChange={set('allergies')}
                  placeholder={t.profile.placeholderAllergies}
                  rows={2}
                />
              </Field>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                <X size={15} /> {t.profile.cancel}
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                <Check size={15} /> {saving ? t.profile.saving : t.profile.saveChanges}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({ icon: Icon, label, value, t }) {
  return (
    <div className={styles.infoGroup}>
      <div className={styles.infoLabel}>
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className={styles.infoValue}>{value || t.profile.notUpdated}</p>
    </div>
  );
}

function BhytRow({ icon: Icon, label, value, highlight, t }) {
  return (
    <div className={styles.bhytRow}>
      <span className={styles.bhytLabel}>
        {Icon && <Icon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        {label}
      </span>
      <span className={`${styles.bhytValue} ${highlight ? styles.bhytHighlight : ''}`}>
        {value || t.profile.notUpdated}
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
