import type { Lancamento } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface FinancialSummary {
  revenueCentavos: number;
  expenseCentavos: number;
  receivableCentavos: number;
  overdueCentavos: number;
  profitCentavos: number;
  receivableCount: number;
  overdueClientCount: number;
}

export function calculateFinancialSummary(entries: Lancamento[]): FinancialSummary {
  const revenues = entries.filter((entry) => entry.tipo === 'receita');
  const expenses = entries.filter((entry) => entry.tipo === 'despesa');

  const revenueCentavos = revenues
    .filter((entry) => entry.status === 'pago')
    .reduce((sum, entry) => sum + entry.valorCentavos, 0);
  const expenseCentavos = expenses
    .filter((entry) => entry.status === 'pago')
    .reduce((sum, entry) => sum + entry.valorCentavos, 0);
  const receivables = revenues.filter((entry) => entry.status === 'pendente' || entry.status === 'atrasado');
  const receivableCentavos = receivables.reduce((sum, entry) => sum + entry.valorCentavos, 0);
  const overdue = revenues.filter((entry) => entry.status === 'atrasado');
  const overdueCentavos = overdue.reduce((sum, entry) => sum + entry.valorCentavos, 0);

  return {
    revenueCentavos,
    expenseCentavos,
    receivableCentavos,
    overdueCentavos,
    profitCentavos: revenueCentavos - expenseCentavos,
    receivableCount: receivables.length,
    overdueClientCount: new Set(overdue.map((entry) => entry.pessoaId).filter(Boolean)).size,
  };
}

export async function listEntries(): Promise<Lancamento[]> {
  if (USE_MOCKS) {
    await delay();
    return db.lancamentos;
  }
  const { data } = await http.get<Lancamento[]>('/financeiro/lancamentos');
  return data;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const entries = await listEntries();
  return calculateFinancialSummary(entries);
}

export async function createEntry(entryData: Omit<Lancamento, 'id'>): Promise<Lancamento> {
  if (USE_MOCKS) {
    await delay(300);
    const created: Lancamento = {
      ...entryData,
      id: `l${Date.now()}`,
    };
    db.lancamentos.push(created);
    saveDB();
    return created;
  }
  const { data } = await http.post<Lancamento>('/financeiro/lancamentos', entryData);
  return data;
}
