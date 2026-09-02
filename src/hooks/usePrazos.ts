import { getDeadline, listDeadlines } from '@/services/prazos.service';
import type { PrazoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function usePrazos(filters: PrazoFiltros = {}) {
  return useAsync(() => listDeadlines(filters), [JSON.stringify(filters)]);
}

export function usePrazo(id: string | undefined) {
  return useAsync(() => (id ? getDeadline(id) : Promise.resolve(undefined)), [id]);
}
