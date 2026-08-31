import { buscarProcesso, listarProcessos } from '@/services/processos.service';
import type { ProcessoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useProcessos(filtros: ProcessoFiltros = {}) {
  return useAsync(() => listarProcessos(filtros), [JSON.stringify(filtros)]);
}

export function useProcesso(id: string | undefined) {
  return useAsync(() => (id ? buscarProcesso(id) : Promise.resolve(undefined)), [id]);
}
