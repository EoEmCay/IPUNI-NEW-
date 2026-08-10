import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { authService } from './services/auth.service';
import AppLayout from './components/layout/AppLayout';
import MobileWrapper from './components/layout/MobileWrapper';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MetricsPage from './pages/Metrics/MetricsPage';
import MedicationsPage from './pages/Medications/MedicationsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import DoctorProfile from './pages/Appointments/DoctorProfile';
import AudioCall from './pages/Appointments/AudioCall';
import AdvicePage from './pages/Advice/AdvicePage';
import ScanPrescriptionPage from './pages/ScanPrescriptionPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import SettingsPage from './pages/SettingsPage';

import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { token, isAuthenticated, setUser, logout, setToken } = useAuthStore();
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    const handleConflict = () => setShowConflictModal(true);
    window.addEventListener('sessionConflict', handleConflict);
    return () => window.removeEventListener('sessionConflict', handleConflict);
  }, []);

  useEffect(() => {
    if (token && isAuthenticated) {
      const fetchStatus = () => {
        authService.getMe()
          .then((res) => setUser(res.data.data))
          .catch(() => {
            // Error handling is partly managed by api.js interceptor
          });
      };

      fetchStatus();
      const interval = setInterval(fetchStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [token, isAuthenticated, setUser]);

  const handleSafe = async () => {
    try {
      const res = await authService.acknowledgeSession();
      setToken(res.data.token);
      setShowConflictModal(false);
    } catch (e) {
      logout();
    }
  };

  const handleNotSafe = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <MobileWrapper>
            <LoginPage />
          </MobileWrapper>
        )} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <MobileWrapper>
            <RegisterPage />
          </MobileWrapper>
        )} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/metrics" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <MetricsPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/medications" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <MedicationsPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <AppointmentsPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/doctor/:id" element={
          <ProtectedRoute>
            <MobileWrapper>
              <DoctorProfile />
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/call/:id" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AudioCall />
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/advice" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <AdvicePage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/scan" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <ScanPrescriptionPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/scan-history" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <ScanHistoryPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <MobileWrapper>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </MobileWrapper>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Session Conflict Modal */}
      {showConflictModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '16px',
            maxWidth: '320px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#E53E3E', fontSize: '18px' }}>Cảnh báo bảo mật</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4A5568' }}>
              Tài khoản của bạn vừa được đăng nhập trên một thiết bị khác. Đó có phải là bạn không?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={handleSafe}
                style={{
                  padding: '10px 16px', border: '1px solid #1B5FA6', background: 'white',
                  color: '#1B5FA6', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1
                }}>
                An toàn (Tiếp tục)
              </button>
              <button 
                onClick={handleNotSafe}
                style={{
                  padding: '10px 16px', border: 'none', background: '#E53E3E',
                  color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1
                }}>
                Không phải tôi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
