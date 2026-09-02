import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from '@/types';
import {
  login as loginService,
  logout as logoutService,
  criarEscritorio as criarEscritorioService,
  trocarEscritorio as trocarEscritorioService,
  type DadosOnboarding,
  type Sessao,
} from '@/services/auth.service';
import {
  getTenantConfig,
  type TenantBranding,
  type NavItem,
  type TenantConfig,
} from '@/services/tenant.service';
import { derivarPaletaAccent } from '@/utils/paletaAccent';

function aplicarBranding(branding: TenantBranding | null) {
  const root = document.documentElement;
  if (branding?.corPrimaria) {
    root.style.setProperty('--color-accent', branding.corPrimaria);
    const paleta = derivarPaletaAccent(branding.corPrimaria);
    root.style.setProperty('--color-accent-hover', paleta.accentHover);
    root.style.setProperty('--color-accent-dim', paleta.accentDim);
    root.style.setProperty('--color-on-accent', paleta.onAccent);
  } else {
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-accent-hover');
    root.style.removeProperty('--color-accent-dim');
    root.style.removeProperty('--color-on-accent');
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
    // Só a chave atual conta como sessão válida — http.ts (readStoredToken)
    // só lê 'axionerp.session'. Uma sessão só existindo em 'lawerp.session'
    // (chave legada, de antes do produto se chamar Axion) faz isAuthenticated
    // ficar true aqui mas o token nunca sair nas requisições reais, travando
    // o app num 401 cru em vez de deslogar de verdade (ver BARRIERS B24).
    const raw = localStorage.getItem(STORAGE_KEY);
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
  tenantNavegacao: NavItem[] | null;
  login: (email: string, senha: string) => Promise<void>;
  criarEscritorio: (dados: DadosOnboarding) => Promise<void>;
  /** Troca o tenant ativo por outro em que este e-mail já é admin (sem senha). */
  trocarEscritorio: (tenantId: string) => Promise<void>;
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
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // Ao montar com uma sessão já guardada (refresh de página autenticado),
  // busca o config do tenant de novo — não fica persistido no storage.
  useEffect(() => {
    if (!initialSession?.usuario) return;
    let cancelado = false;
    getTenantConfig()
      .then((config) => {
        if (!cancelado) setTenantConfig(config);
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
    aplicarBranding(tenantConfig?.branding ?? null);
  }, [tenantConfig]);

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
      setTenantConfig(await getTenantConfig());
    } catch {
      setTenantConfig(null);
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

  const trocarEscritorio = useCallback(
    async (tenantId: string) => {
      await commitSessao(await trocarEscritorioService(tenantId));
    },
    [commitSessao]
  );

  const logout = useCallback(async () => {
    // Limpeza local sempre roda, mesmo se a chamada ao servidor falhar (rede
    // fora, token já expirado, 500) — sem o finally, uma falha em
    // logoutService() deixava a sessão travada no cliente pra sempre
    // (ver BARRIERS B24, achado #6 da auditoria).
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
