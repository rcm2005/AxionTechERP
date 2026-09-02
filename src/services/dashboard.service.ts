import type { Alerta, KpiResumo } from '@/types';
import { formatBRL } from '@/utils/format';
import { listarClientes } from './clientes.service';
import { calcularResumoFinanceiro, listarLancamentos } from './financeiro.service';
import { delay } from './mockAdapter';

export interface DashboardResumo {
  kpis: KpiResumo[];
  alertas: Alerta[];
}

export async function buscarResumoDashboard(): Promise<DashboardResumo> {
  await delay();
  const lancamentos = await listarLancamentos();
  const clientes = await listarClientes();

  const resumoFinanceiro = calcularResumoFinanceiro(lancamentos);
  const clientesAtivos = clientes.filter((p) => p.relacao === 'cliente' || p.relacao === 'ambos');
  const clientesInadimplentes = clientes.filter(
    (p) => p.situacaoCredito === 'inadimplente' || p.valorEmAtrasoCentavos > 0,
  );

  const kpis: KpiResumo[] = [
    {
      id: 'receita-faturada',
      label: 'Receita Total (Recebida)',
      valor: formatBRL(resumoFinanceiro.receitaCentavos),
      sub: `Lucro op.: ${formatBRL(resumoFinanceiro.lucroCentavos)}`,
      subTone: resumoFinanceiro.lucroCentavos >= 0 ? 'green' : 'red',
      tipo: 'financeiro',
    },
    {
      id: 'a-receber',
      label: 'Contas a Receber',
      valor: formatBRL(resumoFinanceiro.aReceberCentavos),
      sub: `${resumoFinanceiro.qtdTitulosAReceber} títulos pendentes`,
      subTone: 'orange',
      tipo: 'financeiro',
    },
    {
      id: 'em-atraso',
      label: 'Valores em Atraso',
      valor: formatBRL(resumoFinanceiro.emAtrasoCentavos),
      sub: `${clientesInadimplentes.length} cliente(s) em atraso`,
      subTone: resumoFinanceiro.emAtrasoCentavos > 0 ? 'red' : 'green',
      tipo: 'financeiro',
    },
    {
      id: 'carteira-clientes',
      label: 'Clientes & Parceiros',
      valor: String(clientesAtivos.length),
      sub: `${clientes.length} cadastros totais`,
      tipo: 'vendas',
    },
  ];

  const alertas: Alerta[] = [];
  if (resumoFinanceiro.emAtrasoCentavos > 0) {
    alertas.push({
      id: 'alerta-inadimplencia',
      titulo: `${clientesInadimplentes.length} cliente(s) com títulos vencidos`,
      descricao: `Montante total em atraso: ${formatBRL(resumoFinanceiro.emAtrasoCentavos)}.`,
      tone: 'danger',
      modulo: 'financeiro',
    });
  }

  return { kpis, alertas };
}
