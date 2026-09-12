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
  const adminToken = localStorage.getItem('admin_access_token');
  const cashierToken = localStorage.getItem('cashier_access_token');
  const isAdminRequest =
    config.url?.startsWith('/cashiers') ||
    config.url?.startsWith('/waiters') ||
    config.url?.startsWith('/menu') ||
    config.url?.startsWith('/table-no') ||
    config.url?.startsWith('/kots') ||
    config.url?.startsWith('/bill');
  const token = isAdminRequest && adminToken ? adminToken : cashierToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
