import type { Alerta, KpiResumo } from '@/types';
import { formatBRL } from '@/utils/format';
import { listClients } from './clientes.service';
import { calcularResumoFinanceiro, listarLancamentos } from './financeiro.service';
import { delay } from './mockAdapter';

export interface DashboardSummary {
  kpis: KpiResumo[];
  alerts: Alerta[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  const entries = await listarLancamentos();
  const clients = await listClients();

  const financialSummary = calcularResumoFinanceiro(entries);
  const activeClients = clients.filter((p) => p.relacao === 'cliente' || p.relacao === 'ambos');
  const delinquentClients = clients.filter(
    (p) => p.situacaoCredito === 'inadimplente' || p.valorEmAtrasoCentavos > 0,
  );

  const kpis: KpiResumo[] = [
    {
      id: 'receita-faturada',
      label: 'Receita Total (Recebida)',
      valor: formatBRL(financialSummary.receitaCentavos),
      sub: `Lucro op.: ${formatBRL(financialSummary.lucroCentavos)}`,
      subTone: financialSummary.lucroCentavos >= 0 ? 'green' : 'red',
      tipo: 'financeiro',
    },
    {
      id: 'a-receber',
      label: 'Contas a Receber',
      valor: formatBRL(financialSummary.aReceberCentavos),
      sub: `${financialSummary.qtdTitulosAReceber} títulos pendentes`,
      subTone: 'orange',
      tipo: 'financeiro',
    },
    {
      id: 'em-atraso',
      label: 'Valores em Atraso',
      valor: formatBRL(financialSummary.emAtrasoCentavos),
      sub: `${delinquentClients.length} cliente(s) em atraso`,
      subTone: financialSummary.emAtrasoCentavos > 0 ? 'red' : 'green',
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
  if (financialSummary.emAtrasoCentavos > 0) {
    alerts.push({
      id: 'alerta-inadimplencia',
      titulo: `${delinquentClients.length} cliente(s) com títulos vencidos`,
      descricao: `Montante total em atraso: ${formatBRL(financialSummary.emAtrasoCentavos)}.`,
      tone: 'danger',
      modulo: 'financeiro',
    });
  }

  return { kpis, alerts };
}
