import type { Usuario } from '@/types';
import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/**
 * Serviço mínimo (somente leitura) de usuários.
 *
 * Existe hoje só para popular o select de "responsável" na agenda. Escrita de
 * usuários (convite, papéis, desativação) não faz parte deste escopo.
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  if (USE_MOCKS) {
    await delay();
    return db.usuarios;
  }
  const { data } = await http.get<Usuario[]>('/usuarios');
  return data;
}
