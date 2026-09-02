import type { Usuario } from '@/types';
import { usuarioLogadoMock } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface Session {
  user: Usuario;
  token: string;
}

// Shape returned by the real API (apps/api `POST /auth/login`) — leaner
// than the frontend's `Usuario` (which carries fields from a multi-tenant/
// accountant model that the API does not yet have). We map to the frontend shape with
// sensible defaults for fields the API does not expose yet.
interface ApiLoginResponse {
  token: string;
  user: {
    id: string;
    tenant_id: string;
    nome: string;
    email: string;
    role: 'admin' | 'user';
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstChars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return firstChars.join('') || 'US';
}

function mapApiUserToUser(api: ApiLoginResponse['user']): Usuario {
  return {
    id: api.id,
    nome: api.nome,
    nomeExibicao: api.nome,
    iniciais: getInitials(api.nome),
    email: api.email,
    role: api.role === 'admin' ? 'admin' : 'operador',
    tenantIds: [api.tenant_id],
    tenantAtivoId: api.tenant_id,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
}

export async function login(email: string, password: string): Promise<Session> {
  if (USE_MOCKS) {
    await delay(700);
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    return { user: usuarioLogadoMock, token: 'mock-token' };
  }
  const { data } = await http.post<ApiLoginResponse>('/auth/login', { email, password });
  return { user: mapApiUserToUser(data.user), token: data.token };
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) {
    await delay(100);
    return;
  }
  await http.post('/auth/logout');
}

export interface DadosOnboarding {
  nomeEscritorio: string;
  cnpjOuCpf: string;
  corPrimaria: string;
  adminNome: string;
  adminEmail: string;
  adminPassword: string;
  modulos?: {
    contratos: boolean;
    honorarioExito: boolean;
  };
}

export async function criarEscritorio(data: DadosOnboarding): Promise<Session> {
  if (USE_MOCKS) {
    await delay(900);
    return { user: usuarioLogadoMock, token: 'mock-token' };
  }
  const { data: resData } = await http.post<ApiLoginResponse>('/auth/signup', data);
  return { user: mapApiUserToUser(resData.user), token: resData.token };
}

// ── Multi-firm (used by the /comecar area) ──────────────────────────────────

/** A firm where the current session email is already an admin. */
export interface EscritorioDaConta {
  id: string;
  nome: string;
  nomeExibicao: string;
  corPrimaria: string;
  criadoEm: string;
}

interface ApiTenantResponse {
  id: string;
  nome: string;
  config?: { branding?: { nomeExibicao?: string; corPrimaria?: string } };
  created_at: string;
}

function mapApiTenant(api: ApiTenantResponse): EscritorioDaConta {
  return {
    id: api.id,
    nome: api.nome,
    nomeExibicao: api.config?.branding?.nomeExibicao || api.nome,
    corPrimaria: api.config?.branding?.corPrimaria || '#3157d5',
    criadoEm: api.created_at,
  };
}

const REAL_API_ONLY_ERROR =
  'Esta tela consulta o backend real e não tem versão mockada. Rode com VITE_USE_MOCKS=false.';

/**
 * Firms where the current session email is an admin. The scope is applied on
 * the server from the token — we do not pass any email from here.
 */
export async function listarMeusEscritorios(): Promise<EscritorioDaConta[]> {
  if (USE_MOCKS) {
    throw new Error(REAL_API_ONLY_ERROR);
  }
  const { data } = await http.get<ApiTenantResponse[]>('/auth/my-tenants');
  return data.map(mapApiTenant);
}

/**
 * Switches the active tenant without asking for password again. The server only
 * issues the token if the current token email is already an admin of the requested tenant.
 */
export async function trocarEscritorio(tenantId: string): Promise<Session> {
  if (USE_MOCKS) {
    throw new Error(REAL_API_ONLY_ERROR);
  }
  const { data } = await http.post<ApiLoginResponse>('/auth/switch-tenant', { tenant_id: tenantId });
  return { user: mapApiUserToUser(data.user), token: data.token };
}
