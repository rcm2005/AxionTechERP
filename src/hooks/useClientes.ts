import { buscarCliente, listarClientes } from '@/services/clientes.service';
import type { ClienteFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useClientes(filtros: ClienteFiltros = {}) {
  return useAsync(() => listarClientes(filtros), [JSON.stringify(filtros)]);
}

export function useCliente(id: string | undefined) {
  return useAsync(() => (id ? buscarCliente(id) : Promise.resolve(undefined)), [id]);
}
