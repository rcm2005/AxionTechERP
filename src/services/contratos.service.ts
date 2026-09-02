import type { Contrato, ContratoFiltros, ContratoInput } from '@/types';
import { contratosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** See note on persistence in `processos.service.ts`. */
const store: Contrato[] = [...contratosMock];

function applyFilters(contracts: Contrato[], filters: ContratoFiltros): Contrato[] {
  const search = filters.busca?.trim().toLowerCase();
  return contracts.filter((contract) => {
    if (filters.cliente_id && contract.cliente_id !== filters.cliente_id) return false;
    if (filters.status && contract.status !== filters.status) return false;
    if (search && !`${contract.titulo} ${contract.tipo}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

function filterParams(filters: ContratoFiltros) {
  const { cliente_id, status } = filters;
  return {
    ...(cliente_id ? { cliente_id } : {}),
    ...(status ? { status } : {}),
  };
}

export async function listContracts(filters: ContratoFiltros = {}): Promise<Contrato[]> {
  if (USE_MOCKS) {
    await delay();
    return applyFilters(store, filters);
  }
  const { data } = await http.get<Contrato[]>('/contratos', { params: filterParams(filters) });
  return applyFilters(data, { busca: filters.busca });
}

export async function getContract(id: string): Promise<Contrato | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((contract) => contract.id === id);
  }
  const { data } = await http.get<Contrato>(`/contratos/${id}`);
  return data;
}

export async function createContract(input: ContratoInput): Promise<Contrato> {
  if (USE_MOCKS) {
    await delay(300);
    const newContract: Contrato = { ...input, id: `ctr-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(newContract);
    return newContract;
  }
  const { data } = await http.post<Contrato>('/contratos', input);
  return data;
}

export async function updateContract(id: string, input: ContratoInput): Promise<Contrato> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((contract) => contract.id === id);
    if (index < 0) throw new Error('Contrato não encontrado.');
    store[index] = { ...store[index], ...input, updated_at: new Date().toISOString() };
    return store[index];
  }
  const { data } = await http.put<Contrato>(`/contratos/${id}`, input);
  return data;
}

export async function deleteContract(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const index = store.findIndex((contract) => contract.id === id);
    if (index >= 0) store.splice(index, 1);
    return;
  }
  await http.delete(`/contratos/${id}`);
}

