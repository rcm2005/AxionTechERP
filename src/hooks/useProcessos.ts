import { getCase, listCases } from '@/services/processos.service';
import type { ProcessoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useProcessos(filters: ProcessoFiltros = {}) {
  return useAsync(() => listCases(filters), [JSON.stringify(filters)]);
}

export function useProcesso(id: string | undefined) {
  return useAsync(() => (id ? getCase(id) : Promise.resolve(undefined)), [id]);
}
