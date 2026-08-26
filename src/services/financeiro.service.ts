import type { Lancamento } from '@/types';
import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface ResumoFinanceiro {
  receitaCentavos: number;
  despesaCentavos: number;
  aReceberCentavos: number;
  emAtrasoCentavos: number;
  lucroCentavos: number;
  qtdTitulosAReceber: number;
  qtdClientesEmAtraso: number;
}

export function calcularResumoFinanceiro(lancamentos: Lancamento[]): ResumoFinanceiro {
  const receitas = lancamentos.filter((l) => l.tipo === 'receita');
  const despesas = lancamentos.filter((l) => l.tipo === 'despesa');

  const receitaCentavos = receitas
    .filter((l) => l.status === 'pago')
    .reduce((sum, l) => sum + l.valorCentavos, 0);
  const despesaCentavos = despesas
    .filter((l) => l.status === 'pago')
    .reduce((sum, l) => sum + l.valorCentavos, 0);
  const aReceber = receitas.filter((l) => l.status === 'pendente' || l.status === 'atrasado');
  const aReceberCentavos = aReceber.reduce((sum, l) => sum + l.valorCentavos, 0);
  const emAtraso = receitas.filter((l) => l.status === 'atrasado');
  const emAtrasoCentavos = emAtraso.reduce((sum, l) => sum + l.valorCentavos, 0);

  return {
    receitaCentavos,
    despesaCentavos,
    aReceberCentavos,
    emAtrasoCentavos,
    lucroCentavos: receitaCentavos - despesaCentavos,
    qtdTitulosAReceber: aReceber.length,
    qtdClientesEmAtraso: new Set(emAtraso.map((l) => l.clienteId)).size,
  };
}

export async function listarLancamentos(): Promise<Lancamento[]> {
  if (USE_MOCKS) {
    await delay();
    return db.lancamentos;
  }
  const { data } = await http.get<Lancamento[]>('/financeiro/lancamentos');
  return data;
}

export async function buscarResumoFinanceiro(): Promise<ResumoFinanceiro> {
  const lancamentos = await listarLancamentos();
  return calcularResumoFinanceiro(lancamentos);
}

export async function criarLancamento(dados: Omit<Lancamento, 'id'>): Promise<Lancamento> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Lancamento = {
      ...dados,
      id: `l${Date.now()}`,
    };
    db.lancamentos.push(novo);
    return novo;
  }
  const { data } = await http.post<Lancamento>('/financeiro/lancamentos', dados);
  return data;
}
