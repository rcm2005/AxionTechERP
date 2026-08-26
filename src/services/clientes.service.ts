import type { Pessoa, PessoaFiltros } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filtrarClientes(pessoas: Pessoa[], filtros: PessoaFiltros): Pessoa[] {
  const busca = filtros.busca?.trim().toLowerCase();

  return pessoas.filter((c) => {
    if (busca) {
      const alvo = `${c.razaoSocialOuNome} ${c.nomeFantasia ?? ''} ${c.documento} ${c.email}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    if (filtros.status && filtros.status !== 'todos' && c.status !== filtros.status) return false;
    if (filtros.relacao && filtros.relacao !== 'todos' && c.relacao !== filtros.relacao) return false;
    if (filtros.tipoPessoa && filtros.tipoPessoa !== 'todos' && c.tipoPessoa !== filtros.tipoPessoa) return false;
    if (filtros.situacaoCredito && filtros.situacaoCredito !== 'todos' && c.situacaoCredito !== filtros.situacaoCredito) return false;
    return true;
  });
}

export async function listarClientes(filtros: PessoaFiltros = {}): Promise<Pessoa[]> {
  if (USE_MOCKS) {
    await delay();
    return filtrarClientes(db.pessoas, filtros);
  }
  const { data } = await http.get<Pessoa[]>('/clientes', { params: filtros });
  return data;
}

export async function buscarCliente(id: string): Promise<Pessoa | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.pessoas.find((c) => c.id === id);
  }
  const { data } = await http.get<Pessoa>(`/clientes/${id}`);
  return data;
}

export async function criarCliente(
  dados: Omit<Pessoa, 'id' | 'criadoEm'>,
): Promise<Pessoa> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Pessoa = {
      ...dados,
      id: `pes-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    db.pessoas.push(novo);
    saveDB();
    return novo;
  }
  const { data } = await http.post<Pessoa>('/clientes', dados);
  return data;
}
