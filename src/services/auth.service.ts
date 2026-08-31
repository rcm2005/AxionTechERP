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
