import { buscarPrazo, listarPrazos } from '@/services/prazos.service';
import type { PrazoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function usePrazos(filtros: PrazoFiltros = {}) {
  return useAsync(() => listarPrazos(filtros), [JSON.stringify(filtros)]);
}

export function usePrazo(id: string | undefined) {
  return useAsync(() => (id ? buscarPrazo(id) : Promise.resolve(undefined)), [id]);
}
