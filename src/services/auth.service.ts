import type { Usuario } from '@/types';
import { usuarioLogadoMock } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface Sessao {
  usuario: Usuario;
  token: string;
}

// Shape retornado pela API real (apps/api `POST /auth/login`) — mais enxuto
// que o `Usuario` do frontend (que carrega campos de um modelo multi-tenant/
// contador que a API ainda não tem). Mapeamos pro shape do frontend com
// defaults razoáveis nos campos que a API não expõe ainda.
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

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return primeiras.join('') || 'US';
}

function mapApiUserToUsuario(api: ApiLoginResponse['user']): Usuario {
  return {
    id: api.id,
    nome: api.nome,
    nomeExibicao: api.nome,
    iniciais: iniciaisDe(api.nome),
    email: api.email,
    role: api.role === 'admin' ? 'admin' : 'operador',
    tenantIds: [api.tenant_id],
    tenantAtivoId: api.tenant_id,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
}

export async function login(email: string, senha: string): Promise<Sessao> {
  if (USE_MOCKS) {
    await delay(700);
    if (!email || !senha) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    return { usuario: usuarioLogadoMock, token: 'mock-token' };
  }
  const { data } = await http.post<ApiLoginResponse>('/auth/login', { email, password: senha });
  return { usuario: mapApiUserToUsuario(data.user), token: data.token };
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
}

export async function criarEscritorio(dados: DadosOnboarding): Promise<Sessao> {
  if (USE_MOCKS) {
    await delay(900);
    return { usuario: usuarioLogadoMock, token: 'mock-token' };
  }
  const { data } = await http.post<ApiLoginResponse>('/auth/signup', dados);
  return { usuario: mapApiUserToUsuario(data.user), token: data.token };
}

// ── Multi-escritório (usado pela área /comecar) ──────────────────────────────

/** Um escritório onde o e-mail da sessão atual já é admin. */
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

const ERRO_SO_API_REAL =
  'Esta tela consulta o backend real e não tem versão mockada. Rode com VITE_USE_MOCKS=false.';

/**
 * Escritórios em que o e-mail da sessão atual é admin. O escopo é aplicado no
 * servidor a partir do token — não passamos e-mail nenhum daqui.
 */
export async function listarMeusEscritorios(): Promise<EscritorioDaConta[]> {
  if (USE_MOCKS) {
    throw new Error(ERRO_SO_API_REAL);
  }
  const { data } = await http.get<ApiTenantResponse[]>('/auth/my-tenants');
  return data.map(mapApiTenant);
}

/**
 * Troca o tenant ativo sem pedir senha de novo. O servidor só emite o token se
 * o e-mail do token atual já for admin do tenant pedido.
 */
export async function trocarEscritorio(tenantId: string): Promise<Sessao> {
  if (USE_MOCKS) {
    throw new Error(ERRO_SO_API_REAL);
  }
  const { data } = await http.post<ApiLoginResponse>('/auth/switch-tenant', { tenant_id: tenantId });
  return { usuario: mapApiUserToUsuario(data.user), token: data.token };
}
