import type { Prazo, PrazoFiltros, PrazoInput, PrazoStatus } from '@/types';
import { prazosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** See note on persistence in `processos.service.ts`. */
const store: Prazo[] = [...prazosMock];

function applyFilters(deadlines: Prazo[], filters: PrazoFiltros): Prazo[] {
  return deadlines.filter((d) => {
    if (filters.processo_id && d.processo_id !== filters.processo_id) return false;
    if (filters.status && filters.status !== 'todos' && d.status !== filters.status) return false;
    return true;
  });
}

function filterParams(filters: PrazoFiltros) {
  const { processo_id, status } = filters;
  return {
    ...(processo_id ? { processo_id } : {}),
    ...(status && status !== 'todos' ? { status } : {}),
  };
}

/** Most urgent first — the order in which the lawyer needs to act. */
function sortByFatalDeadline(deadlines: Prazo[]): Prazo[] {
  return [...deadlines].sort((a, b) => a.prazo_fatal.localeCompare(b.prazo_fatal));
}

export async function listDeadlines(filters: PrazoFiltros = {}): Promise<Prazo[]> {
  if (USE_MOCKS) {
    await delay();
    return sortByFatalDeadline(applyFilters(store, filters));
  }
  const { data } = await http.get<Prazo[]>('/prazos', { params: filterParams(filters) });
  return sortByFatalDeadline(data);
}

export async function getDeadline(id: string): Promise<Prazo | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((d) => d.id === id);
  }
  const { data } = await http.get<Prazo>(`/prazos/${id}`);
  return data;
}

export async function createDeadline(data: PrazoInput): Promise<Prazo> {
  if (USE_MOCKS) {
    await delay(300);
    const newDeadline: Prazo = { ...data, id: `prazo-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(newDeadline);
    return newDeadline;
  }
  const response = await http.post<Prazo>('/prazos', data);
  return response.data;
}

export async function updateDeadline(id: string, data: PrazoInput): Promise<Prazo> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((d) => d.id === id);
    if (index < 0) throw new Error('Prazo não encontrado.');
    store[index] = { ...store[index], ...data, updated_at: new Date().toISOString() };
    return store[index];
  }
  const response = await http.put<Prazo>(`/prazos/${id}`, data);
  return response.data;
}

/**
 * List shortcut ("mark as completed").
 *
 * The endpoint is PUT (replacement), so we re-read the record before writing
 * instead of sending only `{ status }` — sending a partial payload on a PUT
 * would erase the other deadline fields.
 */
export async function changeDeadlineStatus(id: string, status: PrazoStatus): Promise<Prazo> {
  const current = await getDeadline(id);
  if (!current) throw new Error('Prazo não encontrado.');
  return updateDeadline(id, {
    processo_id: current.processo_id,
    descricao: current.descricao,
    data_intimacao: current.data_intimacao ?? null,
    prazo_fatal: current.prazo_fatal,
    dias_uteis: current.dias_uteis ?? null,
    origem: current.origem,
    status,
  });
}

export async function deleteDeadline(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((d) => d.id === id);
    if (index >= 0) store.splice(index, 1);
    return;
  }
  await http.delete(`/prazos/${id}`);
}
