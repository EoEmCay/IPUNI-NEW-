import axios from 'axios';

const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:3001/api/v1' : 'https://dia-5hzu.onrender.com/api/v1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  timeout: 60000, // Tăng lên 60 giây để chờ máy chủ Render khởi động (nếu dùng gói free)
});

let cachedToken = null;

api.interceptors.request.use((config) => {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('diaplus_token');
  }
  if (cachedToken) config.headers.Authorization = `Bearer ${cachedToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (err.response.data?.code === 'SESSION_CONFLICT') {
        window.dispatchEvent(new CustomEvent('sessionConflict'));
      } else {
        cachedToken = null;
        localStorage.removeItem('diaplus_token');
        if (window.location.hash.startsWith('#/')) {
          window.location.hash = '#/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export function updateTokenCache(token) {
  cachedToken = token;
}

export default api;

