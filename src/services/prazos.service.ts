import type { Prazo, PrazoFiltros, PrazoInput, PrazoStatus } from '@/types';
import { prazosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** Ver nota sobre persistência em `processos.service.ts`. */
const store: Prazo[] = [...prazosMock];

function aplicarFiltros(prazos: Prazo[], filtros: PrazoFiltros): Prazo[] {
  return prazos.filter((p) => {
    if (filtros.processo_id && p.processo_id !== filtros.processo_id) return false;
    if (filtros.status && filtros.status !== 'todos' && p.status !== filtros.status) return false;
    return true;
  });
}

function paramsDeFiltro(filtros: PrazoFiltros) {
  const { processo_id, status } = filtros;
  return {
    ...(processo_id ? { processo_id } : {}),
    ...(status && status !== 'todos' ? { status } : {}),
  };
}

/** Mais urgente primeiro — é a ordem em que o advogado precisa agir. */
function ordenarPorPrazoFatal(prazos: Prazo[]): Prazo[] {
  return [...prazos].sort((a, b) => a.prazo_fatal.localeCompare(b.prazo_fatal));
}

export async function listarPrazos(filtros: PrazoFiltros = {}): Promise<Prazo[]> {
  if (USE_MOCKS) {
    await delay();
    return ordenarPorPrazoFatal(aplicarFiltros(store, filtros));
  }
  const { data } = await http.get<Prazo[]>('/prazos', { params: paramsDeFiltro(filtros) });
  return ordenarPorPrazoFatal(data);
}

export async function buscarPrazo(id: string): Promise<Prazo | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((p) => p.id === id);
  }
  const { data } = await http.get<Prazo>(`/prazos/${id}`);
  return data;
}

export async function criarPrazo(dados: PrazoInput): Promise<Prazo> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Prazo = { ...dados, id: `prazo-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(novo);
    return novo;
  }
  const { data } = await http.post<Prazo>('/prazos', dados);
  return data;
}

export async function atualizarPrazo(id: string, dados: PrazoInput): Promise<Prazo> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Prazo não encontrado.');
    store[i] = { ...store[i], ...dados, updated_at: new Date().toISOString() };
    return store[i];
  }
  const { data } = await http.put<Prazo>(`/prazos/${id}`, dados);
  return data;
}

/**
 * Atalho da lista ("marcar como cumprido").
 *
 * O endpoint é PUT (substituição), então relemos o registro antes de escrever
 * em vez de mandar só `{ status }` — mandar parcial num PUT apagaria os demais
 * campos do prazo.
 */
export async function alterarStatusPrazo(id: string, status: PrazoStatus): Promise<Prazo> {
  const atual = await buscarPrazo(id);
  if (!atual) throw new Error('Prazo não encontrado.');
  return atualizarPrazo(id, {
    processo_id: atual.processo_id,
    descricao: atual.descricao,
    data_intimacao: atual.data_intimacao ?? null,
    prazo_fatal: atual.prazo_fatal,
    dias_uteis: atual.dias_uteis ?? null,
    origem: atual.origem,
    status,
  });
}

export async function excluirPrazo(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((p) => p.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  await http.delete(`/prazos/${id}`);
}
