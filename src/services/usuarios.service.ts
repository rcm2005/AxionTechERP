import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/**
 * Shape real de `GET /api/usuarios` — bem mais enxuto que `Usuario` (que
 * carrega campos de um modelo multi-tenant/contador que a API não tem, ver
 * `auth.service.ts`). Usar este tipo aqui evita reivindicar campos
 * (`nomeExibicao`, `iniciais`, `tenantIds`...) que só existem no mock.
 */
export interface UsuarioResumo {
  id: string;
  tenant_id: string;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

/**
 * Serviço mínimo (somente leitura) de usuários.
 *
 * Existe hoje só para popular o select de "responsável" na agenda. Escrita de
 * usuários (convite, papéis, desativação) não faz parte deste escopo.
 */
export async function listarUsuarios(): Promise<UsuarioResumo[]> {
  if (USE_MOCKS) {
    await delay();
    return db.usuarios as unknown as UsuarioResumo[];
  }
  const { data } = await http.get<UsuarioResumo[]>('/usuarios');
  return data;
}
