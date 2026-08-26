import type { Usuario } from '@/types';
import { usuarioLogadoMock } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface Sessao {
  usuario: Usuario;
  token: string;
}

export async function login(email: string, senha: string): Promise<Sessao> {
  if (USE_MOCKS) {
    await delay(700);
    if (!email || !senha) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    return { usuario: usuarioLogadoMock, token: 'mock-token' };
  }
  const { data } = await http.post<Sessao>('/auth/login', { email, senha });
  return data;
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) {
    await delay(100);
    return;
  }
  await http.post('/auth/logout');
}
