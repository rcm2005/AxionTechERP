import { buscarContrato, listarContratos } from '@/services/contratos.service';
import type { ContratoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useContratos(filtros: ContratoFiltros = {}) {
  return useAsync(() => listarContratos(filtros), [JSON.stringify(filtros)]);
}

export function useContrato(id: string | undefined) {
  return useAsync(() => (id ? buscarContrato(id) : Promise.resolve(undefined)), [id]);
}
