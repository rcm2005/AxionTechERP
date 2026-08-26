import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Usuario } from '@/types';
import { login as loginService, logout as logoutService } from '@/services/auth.service';

const STORAGE_KEY = 'lawerp.session';

interface StoredSession {
  usuario: Usuario;
  token: string;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => readStoredSession()?.usuario ?? null);

  const login = useCallback(async (email: string, senha: string) => {
    const sessao = await loginService(email, senha);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    setUsuario(sessao.usuario);
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated: usuario !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
