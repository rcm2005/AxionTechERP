import type { Cliente, ClienteFiltros } from '@/types';
import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filtrarClientes(clientes: Cliente[], filtros: ClienteFiltros): Cliente[] {
  const busca = filtros.busca?.trim().toLowerCase();

  return clientes.filter((c) => {
    if (busca) {
      const alvo = `${c.nome} ${c.documento}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    if (filtros.status && filtros.status !== 'todos' && c.status !== filtros.status) return false;
    if (
      filtros.responsavelId &&
      filtros.responsavelId !== 'todos' &&
      c.responsavelId !== filtros.responsavelId
    ) {
      return false;
    }
    return true;
  });
}

export async function listarClientes(filtros: ClienteFiltros = {}): Promise<Cliente[]> {
  if (USE_MOCKS) {
    await delay();
    return filtrarClientes(db.clientes, filtros);
  }
  const { data } = await http.get<Cliente[]>('/clientes', { params: filtros });
  return data;
}

export async function buscarCliente(id: string): Promise<Cliente | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.clientes.find((c) => c.id === id);
  }
  const { data } = await http.get<Cliente>(`/clientes/${id}`);
  return data;
}

export async function criarCliente(
  dados: Omit<Cliente, 'id' | 'criadoEm' | 'qtdProcessos'>,
): Promise<Cliente> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Cliente = {
      ...dados,
      id: `c${Date.now()}`,
      criadoEm: new Date().toISOString().slice(0, 10),
      qtdProcessos: 0,
    };
    db.clientes.push(novo);
    return novo;
  }
  const { data } = await http.post<Cliente>('/clientes', dados);
  return data;
}
