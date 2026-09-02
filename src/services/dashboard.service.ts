import type { Alerta, KpiResumo } from '@/types';
import { formatBRL } from '@/utils/format';
import { listClients } from './clientes.service';
import { calculateFinancialSummary, listEntries } from './financeiro.service';
import { delay } from './mockAdapter';

export interface DashboardSummary {
  kpis: KpiResumo[];
  alerts: Alerta[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  const entries = await listEntries();
  const clients = await listClients();

  const financialSummary = calculateFinancialSummary(entries);
  const activeClients = clients.filter((p) => p.relacao === 'cliente' || p.relacao === 'ambos');
  const delinquentClients = clients.filter(
    (p) => p.situacaoCredito === 'inadimplente' || p.valorEmAtrasoCentavos > 0,
  );

  const kpis: KpiResumo[] = [
    {
      id: 'receita-faturada',
      label: 'Receita Total (Recebida)',
      valor: formatBRL(financialSummary.revenueCentavos),
      sub: `Lucro op.: ${formatBRL(financialSummary.profitCentavos)}`,
      subTone: financialSummary.profitCentavos >= 0 ? 'green' : 'red',
      tipo: 'financeiro',
    },
    {
      id: 'a-receber',
      label: 'Contas a Receber',
      valor: formatBRL(financialSummary.receivableCentavos),
      sub: `${financialSummary.receivableCount} títulos pendentes`,
      subTone: 'orange',
      tipo: 'financeiro',
    },
    {
      id: 'em-atraso',
      label: 'Valores em Atraso',
      valor: formatBRL(financialSummary.overdueCentavos),
      sub: `${delinquentClients.length} cliente(s) em atraso`,
      subTone: financialSummary.overdueCentavos > 0 ? 'red' : 'green',
      tipo: 'financeiro',
    },
    {
      id: 'carteira-clientes',
      label: 'Clientes & Parceiros',
      valor: String(activeClients.length),
      sub: `${clients.length} cadastros totais`,
      tipo: 'vendas',
    },
  ];

  const alerts: Alerta[] = [];
  if (financialSummary.overdueCentavos > 0) {
    alerts.push({
      id: 'alerta-inadimplencia',
      titulo: `${delinquentClients.length} cliente(s) com títulos vencidos`,
      descricao: `Montante total em atraso: ${formatBRL(financialSummary.overdueCentavos)}.`,
      tone: 'danger',
      modulo: 'financeiro',
    });
  }

  return { kpis, alerts };
}
