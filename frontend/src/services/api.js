import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
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
      cachedToken = null;
      localStorage.removeItem('diaplus_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function updateTokenCache(token) {
  cachedToken = token;
}

export default api;

