import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('lawerp.token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
