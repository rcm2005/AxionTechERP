import axios from 'axios';
import type { AgendaEvento, AgendaEventoInput, AgendaFiltros } from '@/types';
import { agendaEventosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** See persistence note in `processos.service.ts`. */
const store: AgendaEvento[] = [...agendaEventosMock];

/**
 * Scheduling conflict error.
 *
 * The backend prevents double-booking for the same assignee at the database level
 * and returns HTTP 409 `{ error: 'Conflict', message }`. This is a legitimate
 * business validation, not a failure — the UI needs to display the server message
 * next to the field, rather than a generic "error saving".
 */
export class ScheduleConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleConflictError';
  }
}

const DEFAULT_CONFLICT_MESSAGE =
  'Já existe um compromisso para este responsável nesse horário.';

/**
 * Converts backend 409 into `ScheduleConflictError`; any other error is
 * passed through untouched to avoid masking real failures (401, 500, network).
 */
function translateError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const body = error.response.data as { message?: string } | undefined;
    throw new ScheduleConflictError(body?.message?.trim() || DEFAULT_CONFLICT_MESSAGE);
  }
  throw error;
}

function endsAt(startIso: string, durationMinutes: number): number {
  return new Date(startIso).getTime() + durationMinutes * 60_000;
}

/**
 * Reproduces the backend overlap check in mock mode, so that the
 * 409 error path can be exercised without a server.
 */
function ensureNoConflict(candidate: AgendaEventoInput, ignoreId?: string): void {
  const start = new Date(candidate.data_hora).getTime();
  const end = endsAt(candidate.data_hora, candidate.duracao_minutos);

  const conflicts = store.some((event) => {
    if (event.id === ignoreId) return false;
    if (event.responsavel_usuario_id !== candidate.responsavel_usuario_id) return false;
    const eventStart = new Date(event.data_hora).getTime();
    return start < endsAt(event.data_hora, event.duracao_minutos) && eventStart < end;
  });

  if (conflicts) throw new ScheduleConflictError(DEFAULT_CONFLICT_MESSAGE);
}

function applyFilters(events: AgendaEvento[], filters: AgendaFiltros): AgendaEvento[] {
  return events.filter((event) => {
    if (filters.processo_id && event.processo_id !== filters.processo_id) return false;
    if (filters.responsavel_usuario_id && event.responsavel_usuario_id !== filters.responsavel_usuario_id)
      return false;
    if (filters.tipo && filters.tipo !== 'todos' && event.tipo !== filters.tipo) return false;
    if (filters.status && filters.status !== 'todos' && event.status !== filters.status) return false;
    return true;
  });
}

function filterParams(filters: AgendaFiltros) {
  const { processo_id, responsavel_usuario_id, tipo, status } = filters;
  return {
    ...(processo_id ? { processo_id } : {}),
    ...(responsavel_usuario_id ? { responsavel_usuario_id } : {}),
    ...(tipo && tipo !== 'todos' ? { tipo } : {}),
    ...(status && status !== 'todos' ? { status } : {}),
  };
}

function sortChronologically(events: AgendaEvento[]): AgendaEvento[] {
  return [...events].sort((a, b) => a.data_hora.localeCompare(b.data_hora));
}

export async function listScheduleEvents(filters: AgendaFiltros = {}): Promise<AgendaEvento[]> {
  if (USE_MOCKS) {
    await delay();
    return sortChronologically(applyFilters(store, filters));
  }
  const { data } = await http.get<AgendaEvento[]>('/agenda-eventos', {
    params: filterParams(filters),
  });
  return sortChronologically(data);
}

export async function getScheduleEvent(id: string): Promise<AgendaEvento | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((event) => event.id === id);
  }
  const { data } = await http.get<AgendaEvento>(`/agenda-eventos/${id}`);
  return data;
}

/** @throws {ScheduleConflictError} when the assignee's time slot is already occupied. */
export async function createScheduleEvent(input: AgendaEventoInput): Promise<AgendaEvento> {
  if (USE_MOCKS) {
    await delay(300);
    ensureNoConflict(input);
    const newEvent: AgendaEvento = { ...input, id: `agev-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(newEvent);
    return newEvent;
  }
  try {
    const { data } = await http.post<AgendaEvento>('/agenda-eventos', input);
    return data;
  } catch (error) {
    translateError(error);
  }
}

/** @throws {ScheduleConflictError} when the assignee's time slot is already occupied. */
export async function updateScheduleEvent(
  id: string,
  input: Partial<AgendaEventoInput>,
): Promise<AgendaEvento> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((event) => event.id === id);
    if (index < 0) throw new Error('Evento não encontrado.');
    const updated = { ...store[index], ...input };
    ensureNoConflict(updated, id);
    store[index] = { ...updated, updated_at: new Date().toISOString() };
    return store[index];
  }
  try {
    const { data } = await http.put<AgendaEvento>(`/agenda-eventos/${id}`, input);
    return data;
  } catch (error) {
    translateError(error);
  }
}

export async function deleteScheduleEvent(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((event) => event.id === id);
    if (index >= 0) store.splice(index, 1);
    return;
  }
  await http.delete(`/agenda-eventos/${id}`);
}
