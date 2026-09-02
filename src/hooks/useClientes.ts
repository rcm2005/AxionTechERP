import { getClient, listClients } from '@/services/clientes.service';
import type { ClienteFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useClientes(filters: ClienteFiltros = {}) {
  return useAsync(() => listClients(filters), [JSON.stringify(filters)]);
}

export function useCliente(id: string | undefined) {
  return useAsync(() => (id ? getClient(id) : Promise.resolve(undefined)), [id]);
}
