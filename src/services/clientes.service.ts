import type { Pessoa, PessoaFiltros } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filterClients(clients: Pessoa[], filters: PessoaFiltros): Pessoa[] {
  const search = filters.busca?.trim().toLowerCase();

  return clients.filter((client) => {
    if (search) {
      const target = `${client.razaoSocialOuNome} ${client.nomeFantasia ?? ''} ${client.documento} ${client.email}`.toLowerCase();
      if (!target.includes(search)) return false;
    }
    if (filters.status && filters.status !== 'todos' && client.status !== filters.status) return false;
    if (filters.relacao && filters.relacao !== 'todos' && client.relacao !== filters.relacao) return false;
    if (filters.tipoPessoa && filters.tipoPessoa !== 'todos' && client.tipoPessoa !== filters.tipoPessoa) return false;
    if (filters.situacaoCredito && filters.situacaoCredito !== 'todos' && client.situacaoCredito !== filters.situacaoCredito) return false;
    return true;
  });
}

export async function listClients(filters: PessoaFiltros = {}): Promise<Pessoa[]> {
  if (USE_MOCKS) {
    await delay();
    return filterClients(db.pessoas, filters);
  }
  const { data } = await http.get<Pessoa[]>('/clientes', { params: filters });
  return data;
}

export async function getClient(id: string): Promise<Pessoa | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.pessoas.find((client) => client.id === id);
  }
  const { data } = await http.get<Pessoa>(`/clientes/${id}`);
  return data;
}

export async function createClient(
  clientData: Omit<Pessoa, 'id' | 'criadoEm'>,
): Promise<Pessoa> {
  if (USE_MOCKS) {
    await delay(300);
    const created: Pessoa = {
      ...clientData,
      id: `pes-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    db.pessoas.push(created);
    saveDB();
    return created;
  }
  const { data } = await http.post<Pessoa>('/clientes', clientData);
  return data;
}

