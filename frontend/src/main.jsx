import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/animations.css';
import './store/themeStore';
import './store/accessibilityStore';
import App from './App.jsx';

import ErrorBoundary from './components/common/ErrorBoundary.jsx';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = '1081815970127-p67o922i2g7vdc6leqkj1f1e5rq1du6d.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
