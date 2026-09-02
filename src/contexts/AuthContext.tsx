import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from '@/types';
import {
  login as loginService,
  logout as logoutService,
  criarEscritorio as criarEscritorioService,
  trocarEscritorio as trocarEscritorioService,
  type DadosOnboarding,
  type Session,
} from '@/services/auth.service';
import {
  getTenantConfig,
  type TenantBranding,
  type NavItem,
  type TenantConfig,
} from '@/services/tenant.service';
import { derivarPaletaAccent } from '@/utils/paletaAccent';

function applyBranding(branding: TenantBranding | null) {
  const root = document.documentElement;
  if (branding?.corPrimaria) {
    root.style.setProperty('--color-accent', branding.corPrimaria);
    const palette = derivarPaletaAccent(branding.corPrimaria);
    root.style.setProperty('--color-accent-hover', palette.accentHover);
    root.style.setProperty('--color-accent-dim', palette.accentDim);
    root.style.setProperty('--color-on-accent', palette.onAccent);
  } else {
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-accent-hover');
    root.style.removeProperty('--color-accent-dim');
    root.style.removeProperty('--color-on-accent');
  }
}

const STORAGE_KEY = 'axionerp.session';

interface StoredSession {
  user?: Usuario;
  usuario?: Usuario;
  token: string;
  empresaAtivaId?: string;
}

function readStoredSession(): StoredSession | null {
  try {
    // Only the current key counts as a valid session — http.ts (readStoredToken)
    // only reads 'axionerp.session'. A session only existing in 'lawerp.session'
    // (legacy key from before the product was called Axion) makes isAuthenticated
    // true here, but the token is never sent in real requests, locking
    // the app in a raw 401 instead of actually logging out (see BARRIERS B24).
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    const resolvedUser = session.user ?? session.usuario;
    if (resolvedUser) {
      session.user = resolvedUser;
      session.usuario = resolvedUser;
    }
    return session;
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
  tenantNavegacao: NavItem[] | null;
  login: (email: string, password: string) => Promise<void>;
  criarEscritorio: (dados: DadosOnboarding) => Promise<void>;
  /** Switch the active tenant to another where this email is already admin (without password). */
  trocarEscritorio: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = readStoredSession();
  const [usuario, setUsuario] = useState<Usuario | null>(
    () => initialSession?.user ?? initialSession?.usuario ?? null
  );
  const [empresaAtivaId, setEmpresaAtivaIdState] = useState<string>(() => {
    if (initialSession?.empresaAtivaId) return initialSession.empresaAtivaId;
    return resolveDefaultEmpresaId(initialSession?.user ?? initialSession?.usuario ?? null);
  });
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // When mounting with an already stored session (authenticated page refresh),
  // fetch tenant config again — it is not persisted in storage.
  useEffect(() => {
    if (!initialSession?.user && !initialSession?.usuario) return;
    let cancelled = false;
    getTenantConfig()
      .then((config) => {
        if (!cancelled) setTenantConfig(config);
      })
      .catch(() => {
        // session might have expired; let ProtectedRoute/interceptor handle it
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyBranding(tenantConfig?.branding ?? null);
  }, [tenantConfig]);

  const setEmpresaAtivaId = useCallback((id: string) => {
    setEmpresaAtivaIdState(id);
    const session = readStoredSession();
    if (session) {
      session.empresaAtivaId = id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, []);

  const commitSession = useCallback(async (session: Session) => {
    const defaultEmpresaId = resolveDefaultEmpresaId(session.user);
    const sessionToStore: StoredSession = {
      token: session.token,
      user: session.user,
      usuario: session.user,
      empresaAtivaId: defaultEmpresaId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToStore));
    setUsuario(session.user);
    setEmpresaAtivaIdState(defaultEmpresaId);
    try {
      setTenantConfig(await getTenantConfig());
    } catch {
      setTenantConfig(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await commitSession(await loginService(email, password));
    },
    [commitSession]
  );

  const criarEscritorio = useCallback(
    async (dados: DadosOnboarding) => {
      await commitSession(await criarEscritorioService(dados));
    },
    [commitSession]
  );

  const trocarEscritorio = useCallback(
    async (tenantId: string) => {
      await commitSession(await trocarEscritorioService(tenantId));
    },
    [commitSession]
  );

  const logout = useCallback(async () => {
    // Local cleanup always runs, even if the server call fails (network
    // offline, token already expired, 500) — without finally, a failure in
    // logoutService() would leave the session stuck on the client forever
    // (see BARRIERS B24, audit finding #6).
    try {
      await logoutService();
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('lawerp.session');
      setUsuario(null);
      setEmpresaAtivaIdState('');
      setTenantConfig(null);
    }
  }, []);

  const tenantBranding = tenantConfig?.branding ?? null;
  const tenantNavegacao = tenantConfig?.navegacao.itens ?? null;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        empresaAtivaId,
        setEmpresaAtivaId,
        isAuthenticated: usuario !== null,
        tenantBranding,
        tenantNavegacao,
        login,
        criarEscritorio,
        trocarEscritorio,
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
