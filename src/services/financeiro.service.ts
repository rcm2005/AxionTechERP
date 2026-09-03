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

interface ApiFinanceiroLancamento {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  processo_id: string | null;
  contrato_id: string | null;
  tipo: 'honorario_fixo' | 'honorario_parcelado' | 'honorario_exito' | 'despesa_processual' | 'receita_outra';
  valor: string;
  percentual_exito: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  vencimento: string; // "YYYY-MM-DD"
  created_at: string; // ISO-8601
  deleted_at: string | null;
}

function parseValorToCentavos(valor: string): number {
  const [reaisPart, centavosPartRaw] = valor.split('.');
  const centavosPart = (centavosPartRaw ?? '00').padEnd(2, '0').slice(0, 2);
  return Number(reaisPart) * 100 + Number(centavosPart);
}

function mapCategoria(tipo: ApiFinanceiroLancamento['tipo']): string {
  switch (tipo) {
    case 'honorario_fixo':
      return 'Honorário fixo';
    case 'honorario_parcelado':
      return 'Honorário parcelado';
    case 'honorario_exito':
      return 'Honorário de êxito';
    case 'receita_outra':
      return 'Outra receita';
    case 'despesa_processual':
      return 'Despesa processual';
  }
}

function mapStatus(raw: ApiFinanceiroLancamento, todayIsoDate: string): Lancamento['status'] {
  if (raw.status === 'pago') return 'pago';
  if (raw.status === 'cancelado') return 'cancelado';
  // raw.status === 'pendente' from here on
  return raw.vencimento < todayIsoDate ? 'atrasado' : 'pendente';
}

function mapApiEntryToLancamento(raw: ApiFinanceiroLancamento, todayIsoDate: string): Lancamento {
  const categoria = mapCategoria(raw.tipo);
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    tipo: raw.tipo === 'despesa_processual' ? 'despesa' : 'receita',
    descricao: categoria,
    categoria,
    pessoaId: raw.cliente_id ?? undefined,
    valorCentavos: parseValorToCentavos(raw.valor),
    emissaoEm: raw.created_at,
    vencimento: raw.vencimento,
    status: mapStatus(raw, todayIsoDate),
    criadoEm: raw.created_at,
  };
}

export async function listEntries(): Promise<Lancamento[]> {
  if (USE_MOCKS) {
    await delay();
    return db.lancamentos;
  }
  const { data } = await http.get<ApiFinanceiroLancamento[]>('/financeiro-lancamentos');
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  return data.map((entry) => mapApiEntryToLancamento(entry, todayIsoDate));
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
  const { data } = await http.post<Lancamento>('/financeiro-lancamentos', entryData);
  return data;
}
