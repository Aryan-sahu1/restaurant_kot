import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  const { protocol, hostname } = window.location;
  const apiHost = hostname || 'localhost';

  return `${protocol}//${apiHost}:4000`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  if (config.headers?.Authorization) {
    return config;
  }

  const adminToken = localStorage.getItem('admin_access_token');
  const cashierToken = localStorage.getItem('cashier_access_token');
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const token = isAdminPage && adminToken ? adminToken : cashierToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new CustomEvent('auth:invalid'));
    }

    return Promise.reject(error);
  },
);

export default api;
