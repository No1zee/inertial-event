import axios from 'axios';

const isWeb = typeof window !== 'undefined' && !window.electron;
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:5000';

export const API_BASE_URL = isWeb
  ? '/api'
  : (rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`);


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  // Wake up the backend if we are in Electron
  if (typeof window !== 'undefined' && window.electron) {
    try {
      await window.electron.ipcRenderer.invoke('backend:wake-up');
    } catch (err) {
      console.error('[API] Failed to wake up backend:', err);
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('Nova_auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
