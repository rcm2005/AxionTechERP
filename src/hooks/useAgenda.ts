import type { AgendaFiltros } from '@/types';
import { listarEventos } from '@/services/agenda.service';
import { useAsync } from './useAsync';

export function useAgenda(filtros: AgendaFiltros) {
  const key = JSON.stringify(filtros);
  return useAsync(() => listarEventos(filtros), [key]);
}
