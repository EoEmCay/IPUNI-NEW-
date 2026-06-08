import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ipuni_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ipuni_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
