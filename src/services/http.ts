import axios from 'axios';

const SESSION_STORAGE_KEY = 'axionerp.session';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

http.interceptors.request.use((config) => {
  const token = readStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
