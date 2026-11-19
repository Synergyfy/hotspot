import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 seconds — fail fast instead of hanging forever
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl: string = error.config?.url || '';
    const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const alreadyOnLogin = window.location.pathname.startsWith('/login');

    // A failed sign-in must stay on the page so the error message is visible.
    if (error.response?.status === 401 && !isAuthAttempt && !alreadyOnLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
