import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, AlertTriangle, ShieldCheck, Database, Calendar } from 'lucide-react';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.get(`/analytics/users`, {
        headers: {
          'x-admin-key': adminKey
        }
      });
      setUsers(res.data.data);
      setIsAuthenticated(true);
      localStorage.setItem('ipuni_admin_key', adminKey);
    } catch (err) {
      setError('Sai mã khóa quản trị hoặc lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('ipuni_admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <ShieldCheck size={48} color="var(--color-primary)" />
            <h2>Trung tâm Quản trị DIA+</h2>
            <p>Vui lòng nhập mã khóa quản trị để truy cập dữ liệu hệ thống.</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Nhập mã khóa quản trị..."
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className={styles.input}
              required
            />
            {error && <div className={styles.error}><AlertTriangle size={16} /> {error}</div>}
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Đang xác thực...' : 'Truy cập Hệ thống'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Database size={32} color="var(--color-primary)" />
          <div>
            <h1>Dashboard Quản trị viên</h1>
            <p>Supabase PostgreSQL - Tình trạng: Trực tuyến</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsAuthenticated(false);
            localStorage.removeItem('ipuni_admin_key');
          }} 
          className={styles.logoutBtn}
        >
          Đăng xuất
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(27, 95, 166, 0.1)' }}>
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div className={styles.statInfo}>
            <p>Tổng số Người dùng</p>
            <h3>{users.length}</h3>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
            <Calendar size={24} color="#4caf50" />
          </div>
          <div className={styles.statInfo}>
            <p>Đăng ký mới hôm nay</p>
            <h3>
              {users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}
            </h3>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h3>Danh sách Tài khoản Hiện có</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Loại Bệnh</th>
              <th>Ngày Đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>
                  <span className={styles.badge}>
                    {user.diagnosis === 'type2_diabetes' ? 'Tiểu đường type 2' : 
                     user.diagnosis === 'type1_diabetes' ? 'Tiểu đường type 1' : 'Khác'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Chưa có người dùng nào đăng ký trên nền tảng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
