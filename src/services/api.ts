import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('Mai_auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
