import type { Processo, ProcessoFiltros, ProcessoInput } from '@/types';
import { processosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/**
 * In-memory store for mock mode.
 *
 * Unlike `clientes.service.ts` (which persists in `db`/localStorage), the
 * legal core is intentionally not persisted across reloads: mocks have
 * dates relative to "today" (deadlines expiring, hearings this week), and
 * freezing them in localStorage would turn the demo into an overdue list
 * a few days later. Mock-mode writes only last for the current session.
 */
const store: Processo[] = [...processosMock];

function applyFilters(cases: Processo[], filters: ProcessoFiltros): Processo[] {
  const search = filters.busca?.trim().toLowerCase();
  return cases.filter((caseItem) => {
    if (filters.cliente_id && caseItem.cliente_id !== filters.cliente_id) return false;
    if (filters.status && caseItem.status !== filters.status) return false;
    if (search) {
      const target = `${caseItem.numero_cnj} ${caseItem.tribunal} ${caseItem.vara} ${caseItem.fase} ${caseItem.status}`.toLowerCase();
      if (!target.includes(search)) return false;
    }
    return true;
  });
}

/** `busca` is a UI filter: the backend does not expose full-text on this endpoint. */
function filterParams(filters: ProcessoFiltros) {
  const { cliente_id, status } = filters;
  return {
    ...(cliente_id ? { cliente_id } : {}),
    ...(status ? { status } : {}),
  };
}

export async function listCases(filters: ProcessoFiltros = {}): Promise<Processo[]> {
  if (USE_MOCKS) {
    await delay();
    return applyFilters(store, filters);
  }
  const { data } = await http.get<Processo[]>('/processos', { params: filterParams(filters) });
  // Text search remains client-side even with a real backend.
  return applyFilters(data, { busca: filters.busca });
}

export async function getCase(id: string): Promise<Processo | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((caseItem) => caseItem.id === id);
  }
  const { data } = await http.get<Processo>(`/processos/${id}`);
  return data;
}

export async function createCase(data: ProcessoInput): Promise<Processo> {
  if (USE_MOCKS) {
    await delay(300);
    const newCase: Processo = { ...data, id: `proc-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(newCase);
    return newCase;
  }
  const { data: responseData } = await http.post<Processo>('/processos', data);
  return responseData;
}

/** The backend uses PUT (replacement), not PATCH — send the full object. */
export async function updateCase(id: string, data: ProcessoInput): Promise<Processo> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((caseItem) => caseItem.id === id);
    if (index < 0) throw new Error('Processo não encontrado.');
    store[index] = { ...store[index], ...data, updated_at: new Date().toISOString() };
    return store[index];
  }
  const { data: responseData } = await http.put<Processo>(`/processos/${id}`, data);
  return responseData;
}

/** Soft-delete: the backend only sets `deleted_at`. */
export async function deleteCase(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((caseItem) => caseItem.id === id);
    if (index >= 0) store.splice(index, 1);
    return;
  }
  await http.delete(`/processos/${id}`);
}
