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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
