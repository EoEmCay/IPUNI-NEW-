import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { authService } from './services/auth.service';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MetricsPage from './pages/Metrics/MetricsPage';
import MedicationsPage from './pages/Medications/MedicationsPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import AdvicePage from './pages/Advice/AdvicePage';
import ScanPrescriptionPage from './pages/ScanPrescriptionPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { token, isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token && isAuthenticated) {
      authService.getMe()
        .then((res) => setUser(res.data.data))
        .catch(() => logout());
    }
  }, [token, isAuthenticated, setUser, logout]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/metrics" element={
        <ProtectedRoute>
          <AppLayout>
            <MetricsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/medications" element={
        <ProtectedRoute>
          <AppLayout>
            <MedicationsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <AppLayout>
            <AppointmentsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/advice" element={
        <ProtectedRoute>
          <AppLayout>
            <AdvicePage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/scan" element={
        <ProtectedRoute>
          <AppLayout>
            <ScanPrescriptionPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/scan-history" element={
        <ProtectedRoute>
          <AppLayout>
            <ScanHistoryPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}
