import type { Processo, ProcessoFiltros, ProcessoInput } from '@/types';
import { processosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/**
 * Store em memória do modo mock.
 *
 * Diferente de `clientes.service.ts` (que persiste em `db`/localStorage), o
 * núcleo jurídico não é persistido entre reloads de propósito: os mocks têm
 * datas relativas a "hoje" (prazos vencendo, audiências desta semana) e
 * congelá-los no localStorage transformaria a demo numa lista de vencidos
 * poucos dias depois. Escrita em modo mock vale só para a sessão atual.
 */
const store: Processo[] = [...processosMock];

function aplicarFiltros(processos: Processo[], filtros: ProcessoFiltros): Processo[] {
  const busca = filtros.busca?.trim().toLowerCase();
  return processos.filter((p) => {
    if (filtros.cliente_id && p.cliente_id !== filtros.cliente_id) return false;
    if (filtros.status && p.status !== filtros.status) return false;
    if (busca) {
      const alvo = `${p.numero_cnj} ${p.tribunal} ${p.vara} ${p.fase} ${p.status}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

/** `busca` é filtro de UI: o backend não expõe full-text nesse endpoint. */
function paramsDeFiltro(filtros: ProcessoFiltros) {
  const { cliente_id, status } = filtros;
  return {
    ...(cliente_id ? { cliente_id } : {}),
    ...(status ? { status } : {}),
  };
}

export async function listarProcessos(filtros: ProcessoFiltros = {}): Promise<Processo[]> {
  if (USE_MOCKS) {
    await delay();
    return aplicarFiltros(store, filtros);
  }
  const { data } = await http.get<Processo[]>('/processos', { params: paramsDeFiltro(filtros) });
  // A busca textual continua sendo client-side mesmo com backend real.
  return aplicarFiltros(data, { busca: filtros.busca });
}

export async function buscarProcesso(id: string): Promise<Processo | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((p) => p.id === id);
  }
  const { data } = await http.get<Processo>(`/processos/${id}`);
  return data;
}

export async function criarProcesso(dados: ProcessoInput): Promise<Processo> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Processo = { ...dados, id: `proc-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(novo);
    return novo;
  }
  const { data } = await http.post<Processo>('/processos', dados);
  return data;
}

/** O backend usa PUT (substituição), não PATCH — envie o objeto completo. */
export async function atualizarProcesso(id: string, dados: ProcessoInput): Promise<Processo> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Processo não encontrado.');
    store[i] = { ...store[i], ...dados, updated_at: new Date().toISOString() };
    return store[i];
  }
  const { data } = await http.put<Processo>(`/processos/${id}`, dados);
  return data;
}

/** Soft-delete: o backend apenas marca `deleted_at`. */
export async function excluirProcesso(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((p) => p.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  await http.delete(`/processos/${id}`);
}
