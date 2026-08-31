import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from '@/types';
import {
  login as loginService,
  logout as logoutService,
  criarEscritorio as criarEscritorioService,
  type DadosOnboarding,
  type Sessao,
} from '@/services/auth.service';
import { getTenantBranding, type TenantBranding } from '@/services/tenant.service';

function aplicarBranding(branding: TenantBranding | null) {
  const root = document.documentElement;
  if (branding?.corPrimaria) {
    root.style.setProperty('--color-accent', branding.corPrimaria);
  } else {
    root.style.removeProperty('--color-accent');
  }
}

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
  tenantBranding: TenantBranding | null;
  login: (email: string, senha: string) => Promise<void>;
  criarEscritorio: (dados: DadosOnboarding) => Promise<void>;
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
  const [tenantBranding, setTenantBranding] = useState<TenantBranding | null>(null);

  // Ao montar com uma sessão já guardada (refresh de página autenticado),
  // busca o branding do tenant de novo — não fica persistido no storage.
  useEffect(() => {
    if (!initialSession?.usuario) return;
    let cancelado = false;
    getTenantBranding()
      .then((branding) => {
        if (!cancelado) setTenantBranding(branding);
      })
      .catch(() => {
        // sessão pode ter expirado; deixa o ProtectedRoute/interceptor lidar com isso
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    aplicarBranding(tenantBranding);
  }, [tenantBranding]);

  const setEmpresaAtivaId = useCallback((id: string) => {
    setEmpresaAtivaIdState(id);
    const session = readStoredSession();
    if (session) {
      session.empresaAtivaId = id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, []);

  const commitSessao = useCallback(async (sessao: Sessao) => {
    const defaultEmpresaId = resolveDefaultEmpresaId(sessao.usuario);
    const sessionToStore: StoredSession = {
      ...sessao,
      empresaAtivaId: defaultEmpresaId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToStore));
    setUsuario(sessao.usuario);
    setEmpresaAtivaIdState(defaultEmpresaId);
    try {
      setTenantBranding(await getTenantBranding());
    } catch {
      setTenantBranding(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, senha: string) => {
      await commitSessao(await loginService(email, senha));
    },
    [commitSessao]
  );

  const criarEscritorio = useCallback(
    async (dados: DadosOnboarding) => {
      await commitSessao(await criarEscritorioService(dados));
    },
    [commitSessao]
  );

  const logout = useCallback(async () => {
    await logoutService();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('lawerp.session');
    setUsuario(null);
    setEmpresaAtivaIdState('');
    setTenantBranding(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        empresaAtivaId,
        setEmpresaAtivaId,
        isAuthenticated: usuario !== null,
        tenantBranding,
        login,
        criarEscritorio,
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
