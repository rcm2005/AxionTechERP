import type { Alerta, KpiResumo } from '@/types';
import { db } from '@/mocks';
import { formatBRL } from '@/utils/format';
import { calcularResumoFinanceiro } from './financeiro.service';
import { USE_MOCKS, delay } from './mockAdapter';

export interface DashboardResumo {
  kpis: KpiResumo[];
  alertas: Alerta[];
}

export async function buscarResumoDashboard(): Promise<DashboardResumo> {
  await delay();
  if (!USE_MOCKS) {
    throw new Error('Integração com API real ainda não implementada.');
  }

  const resumoFinanceiro = calcularResumoFinanceiro(db.lancamentos);
  const clientesAtivos = db.pessoas.filter((p) => p.relacao === 'cliente' || p.relacao === 'ambos');
  const clientesInadimplentes = db.pessoas.filter(
    (p) => p.situacaoCredito === 'inadimplente' || p.valorEmAtrasoCentavos > 0,
  );
  const produtosAbaixoMinimo = db.produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

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
      sub: `${db.pessoas.length} cadastros totais`,
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
  if (produtosAbaixoMinimo.length > 0) {
    alertas.push({
      id: 'alerta-estoque',
      titulo: `${produtosAbaixoMinimo.length} item(ns) abaixo do estoque mínimo`,
      descricao: 'SKUs necessitam de reposição imediata no almoxarifado.',
      tone: 'warning',
      modulo: 'estoque',
    });
  }

  return { kpis, alertas };
}
