import { getScheduleEvent, listScheduleEvents } from '@/services/agenda.service';
import { listarUsuarios } from '@/services/usuarios.service';
import type { AgendaFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useAgenda(filters: AgendaFiltros = {}) {
  return useAsync(() => listScheduleEvents(filters), [JSON.stringify(filters)]);
}

export function useAgendaEvento(id: string | undefined) {
  return useAsync(() => (id ? getScheduleEvent(id) : Promise.resolve(undefined)), [id]);
}

/** Used to populate the assignee select in schedule forms. */
export function useUsuarios() {
  return useAsync(() => listarUsuarios(), []);
}
