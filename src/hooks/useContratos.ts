import { getContract, listContracts } from '@/services/contratos.service';
import type { ContratoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useContratos(filters: ContratoFiltros = {}) {
  return useAsync(() => listContracts(filters), [JSON.stringify(filters)]);
}

export function useContrato(id: string | undefined) {
  return useAsync(() => (id ? getContract(id) : Promise.resolve(undefined)), [id]);
}

