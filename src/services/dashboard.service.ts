import { addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import type { Alerta, KpiResumo } from '@/types';
import { REFERENCE_DATE } from '@/config/app';
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

  const hoje = parseISO(REFERENCE_DATE);
  const fimSemana = addDays(hoje, 7);

  const processosAtivos = db.processos.filter((p) => p.status === 'em_andamento');

  const prazosSemana = db.eventos.filter(
    (e) => e.tipo === 'prazo' && isWithinInterval(parseISO(e.inicio), { start: hoje, end: fimSemana }),
  );
  const prazos48h = db.eventos.filter(
    (e) =>
      e.tipo === 'prazo' &&
      isWithinInterval(parseISO(e.inicio), { start: hoje, end: addDays(hoje, 2) }),
  );

  const audienciasHoje = db.eventos.filter(
    (e) => e.tipo === 'audiencia' && isSameDay(parseISO(e.inicio), hoje),
  );
  const audienciasManha = audienciasHoje.filter((e) => parseISO(e.inicio).getHours() < 12);

  const resumoFinanceiro = calcularResumoFinanceiro(db.lancamentos);
  const clientesInadimplentes = db.clientes.filter((c) => c.situacaoFinanceira === 'inadimplente');
  const documentosPendentes = db.processos.reduce((sum, p) => sum + p.qtdDocumentosPendentes, 0);

  const kpis: KpiResumo[] = [
    {
      id: 'processos-ativos',
      label: 'Processos ativos',
      valor: String(processosAtivos.length),
      sub: `${db.processos.length} no total`,
    },
    {
      id: 'prazos-semana',
      label: 'Prazos esta semana',
      valor: String(prazosSemana.length),
      sub: `${prazos48h.length} vencem em 48h`,
      subTone: prazos48h.length > 0 ? 'red' : undefined,
    },
    {
      id: 'audiencias-hoje',
      label: 'Audiências hoje',
      valor: String(audienciasHoje.length),
      sub: `${audienciasManha.length} ainda pela manhã`,
    },
    {
      id: 'a-receber',
      label: 'A receber',
      valor: formatBRL(resumoFinanceiro.aReceberCentavos),
      sub: `${formatBRL(resumoFinanceiro.emAtrasoCentavos)} em atraso`,
      subTone: resumoFinanceiro.emAtrasoCentavos > 0 ? 'red' : 'green',
    },
  ];

  const alertas: Alerta[] = [];
  if (prazos48h.length > 0) {
    alertas.push({
      id: 'alerta-prazos',
      titulo: `${prazos48h.length} prazo${prazos48h.length > 1 ? 's' : ''} vencendo em 48h`,
      descricao: 'Requerem revisão do responsável.',
      tone: 'danger',
    });
  }
  if (clientesInadimplentes.length > 0) {
    alertas.push({
      id: 'alerta-inadimplencia',
      titulo: `${clientesInadimplentes.length} parcela(s) em atraso`,
      descricao: `Total pendente: ${formatBRL(resumoFinanceiro.emAtrasoCentavos)}.`,
      tone: 'warning',
    });
  }
  if (documentosPendentes > 0) {
    alertas.push({
      id: 'alerta-documentos',
      titulo: `${documentosPendentes} documento(s) aguardando assinatura`,
      descricao: 'Vinculados a processos em andamento.',
      tone: 'warning',
    });
  }

  return { kpis, alertas };
}
