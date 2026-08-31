import type { Contrato, ContratoFiltros, ContratoInput } from '@/types';
import { contratosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** Ver nota sobre persistência em `processos.service.ts`. */
const store: Contrato[] = [...contratosMock];

function aplicarFiltros(contratos: Contrato[], filtros: ContratoFiltros): Contrato[] {
  const busca = filtros.busca?.trim().toLowerCase();
  return contratos.filter((c) => {
    if (filtros.cliente_id && c.cliente_id !== filtros.cliente_id) return false;
    if (filtros.status && c.status !== filtros.status) return false;
    if (busca && !`${c.titulo} ${c.tipo}`.toLowerCase().includes(busca)) return false;
    return true;
  });
}

function paramsDeFiltro(filtros: ContratoFiltros) {
  const { cliente_id, status } = filtros;
  return {
    ...(cliente_id ? { cliente_id } : {}),
    ...(status ? { status } : {}),
  };
}

export async function listarContratos(filtros: ContratoFiltros = {}): Promise<Contrato[]> {
  if (USE_MOCKS) {
    await delay();
    return aplicarFiltros(store, filtros);
  }
  const { data } = await http.get<Contrato[]>('/contratos', { params: paramsDeFiltro(filtros) });
  return aplicarFiltros(data, { busca: filtros.busca });
}

export async function buscarContrato(id: string): Promise<Contrato | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((c) => c.id === id);
  }
  const { data } = await http.get<Contrato>(`/contratos/${id}`);
  return data;
}

export async function criarContrato(dados: ContratoInput): Promise<Contrato> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Contrato = { ...dados, id: `ctr-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(novo);
    return novo;
  }
  const { data } = await http.post<Contrato>('/contratos', dados);
  return data;
}

export async function atualizarContrato(id: string, dados: ContratoInput): Promise<Contrato> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((c) => c.id === id);
    if (i < 0) throw new Error('Contrato não encontrado.');
    store[i] = { ...store[i], ...dados, updated_at: new Date().toISOString() };
    return store[i];
  }
  const { data } = await http.put<Contrato>(`/contratos/${id}`, dados);
  return data;
}

export async function excluirContrato(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((c) => c.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  await http.delete(`/contratos/${id}`);
}
