import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/animations.css';
import './store/themeStore';
import './store/accessibilityStore';
import App from './App.jsx';

import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { initNative } from './lib/native';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Khởi tạo lớp native (Capacitor: status bar, splash, bàn phím, nút back) — no-op trên web
initNative();

const GOOGLE_CLIENT_ID = '1081815970127-p67o922i2g7vdc6leqkj1f1e5rq1du6d.apps.googleusercontent.com';

// Đánh thức máy chủ Render ngay khi người dùng vừa mở web (Pre-warming)
const API_URL = import.meta.env.VITE_API_URL || 'https://ipuni-new-api.onrender.com/api/v1';
const HEALTH_URL = API_URL.replace('/api/v1', '/health');
fetch(HEALTH_URL).catch(() => {}); // Gửi request ngầm để gọi máy chủ dậy

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
