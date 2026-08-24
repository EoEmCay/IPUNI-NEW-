import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Lock, Building, ArrowRight, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { clinicService } from './clinicService';

export default function ClinicLoginPage() {
  const navigate = useNavigate();
  const [clinicCode, setClinicCode] = useState('PK-HOAN-MY-01');
  const [doctorName, setDoctorName] = useState('BS.CKII Nguyễn Văn An');
  const [pinCode, setPinCode] = useState('123456');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e?.preventDefault();
    if (!clinicCode.trim() || !doctorName.trim()) {
      setError('Vui lòng nhập đầy đủ Mã phòng khám và Tên Bác sĩ.');
      return;
    }
    clinicService.loginClinic(clinicCode, doctorName);
    navigate('/clinic/dashboard');
  };

  const handleQuickDemo = () => {
    setClinicCode('PK-HOAN-MY-01');
    setDoctorName('BS.CKII Nguyễn Văn An');
    setPinCode('123456');
    clinicService.loginClinic('PK-HOAN-MY-01', 'BS.CKII Nguyễn Văn An');
    navigate('/clinic/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '460px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.3)'
          }}>
            <Stethoscope size={32} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            DIA<span style={{ color: '#ef4444' }}>+</span> CLINIC PORTAL
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '6px 0 0' }}>
            Cổng Quản Trị & Giám Sát Bệnh Nhân Cho Phòng Khám Tư Nhân
          </p>
        </div>

        {/* 1-Click Demo Button */}
        <button
          onClick={handleQuickDemo}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '14.5px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={18} /> 1-Click Vào Phòng Khám Mẫu (Demo Bác Sĩ)
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: '#94a3b8', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span>HOẶC ĐĂNG NHẬP MÃ RIÊNG</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Mã Phòng Khám (Clinic ID):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 14px' }}>
              <Building size={18} color="#94a3b8" />
              <input
                type="text"
                value={clinicCode}
                onChange={(e) => setClinicCode(e.target.value)}
                placeholder="VD: PK-HOAN-MY-01"
                style={{ width: '100%', padding: '12px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Họ và Tên Bác Sĩ:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 14px' }}>
              <Stethoscope size={18} color="#94a3b8" />
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="VD: BS.CKII Nguyễn Văn An"
                style={{ width: '100%', padding: '12px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Mã PIN Bảo Mật Y Tế:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 14px' }}>
              <Lock size={18} color="#94a3b8" />
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Mã PIN 6 số"
                style={{ width: '100%', padding: '12px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px'
            }}
          >
            Đăng nhập Quản Trị Phòng Khám <ArrowRight size={16} />
          </button>
        </form>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <Link
            to="/login"
            style={{ fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            ← Quay về App Người Bệnh (diaplus.vn)
          </Link>
        </div>
      </div>
    </div>
  );
}
