import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Usuario } from '@/types';
import { login as loginService, logout as logoutService } from '@/services/auth.service';

const STORAGE_KEY = 'axionerp.session';

interface StoredSession {
  usuario: Usuario;
  token: string;
  empresaAtivaId?: string;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('lawerp.session');
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function resolveDefaultEmpresaId(user: Usuario | null): string {
  if (!user) return '';
  if (user.tenantAtivoId) return user.tenantAtivoId;
  if (user.tenantIds && user.tenantIds.length > 0) return user.tenantIds[0];
  if (user.portfolioTenantIds && user.portfolioTenantIds.length > 0) return user.portfolioTenantIds[0];
  return '';
}

interface AuthContextValue {
  usuario: Usuario | null;
  empresaAtivaId: string;
  setEmpresaAtivaId: (id: string) => void;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = readStoredSession();
  const [usuario, setUsuario] = useState<Usuario | null>(() => initialSession?.usuario ?? null);
  const [empresaAtivaId, setEmpresaAtivaIdState] = useState<string>(() => {
    if (initialSession?.empresaAtivaId) return initialSession.empresaAtivaId;
    return resolveDefaultEmpresaId(initialSession?.usuario ?? null);
  });

  const setEmpresaAtivaId = useCallback((id: string) => {
    setEmpresaAtivaIdState(id);
    const session = readStoredSession();
    if (session) {
      session.empresaAtivaId = id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const sessao = await loginService(email, senha);
    const defaultEmpresaId = resolveDefaultEmpresaId(sessao.usuario);
    const sessionToStore: StoredSession = {
      ...sessao,
      empresaAtivaId: defaultEmpresaId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToStore));
    setUsuario(sessao.usuario);
    setEmpresaAtivaIdState(defaultEmpresaId);
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('lawerp.session');
    setUsuario(null);
    setEmpresaAtivaIdState('');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        empresaAtivaId,
        setEmpresaAtivaId,
        isAuthenticated: usuario !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
