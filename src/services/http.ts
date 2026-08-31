import axios from 'axios';
import { paths } from '@/routes/paths';

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

// Uma sessão guardada localmente pode não ser mais válida no servidor (token
// expirado, revogado, ou de um tenant/usuário que não existe mais) — sem
// isso, `isAuthenticated` no AuthContext continua `true` (só checa se há um
// usuário guardado, nunca o servidor), o app trata a rota como logada, e
// toda chamada real quebra com um 401 cru na tela. Só reage a 401 de uma
// requisição que *tentou* mandar um Bearer token — um 401 de e-mail/senha
// errados no login em si (sem token nenhum) é erro normal de formulário,
// tratado pela própria LoginPage, não uma sessão que expirou.
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      Boolean(error.config?.headers?.Authorization)
    ) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('lawerp.session');
      if (window.location.pathname !== paths.login) {
        window.location.href = paths.login;
      }
    }
    return Promise.reject(error);
  }
);
