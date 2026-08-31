import { buscarAgendaEvento, listarAgendaEventos } from '@/services/agenda.service';
import { listarUsuarios } from '@/services/usuarios.service';
import type { AgendaFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useAgenda(filtros: AgendaFiltros = {}) {
  return useAsync(() => listarAgendaEventos(filtros), [JSON.stringify(filtros)]);
}

export function useAgendaEvento(id: string | undefined) {
  return useAsync(() => (id ? buscarAgendaEvento(id) : Promise.resolve(undefined)), [id]);
}

/** Usado para popular o select de responsável nos formulários de agenda. */
export function useUsuarios() {
  return useAsync(() => listarUsuarios(), []);
}
