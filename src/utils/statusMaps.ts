import type {
  ClienteStatus,
  SituacaoFinanceira,
  ProcessoStatus,
  PrioridadeEvento,
  TipoEvento,
  StatusLancamento,
  Tone,
} from '@/types';

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const clienteStatusMeta: Record<ClienteStatus, StatusMeta> = {
  ativo: { label: 'Ativo', tone: 'green' },
  inativo: { label: 'Inativo', tone: 'orange' },
  prospect: { label: 'Prospect', tone: 'blue' },
};

export const situacaoFinanceiraMeta: Record<SituacaoFinanceira, StatusMeta> = {
  em_dia: { label: 'Em dia', tone: 'green' },
  inadimplente: { label: 'Em atraso', tone: 'red' },
  sem_lancamentos: { label: 'Sem lançamentos', tone: 'neutral' },
};

export const processoStatusMeta: Record<ProcessoStatus, StatusMeta> = {
  em_andamento: { label: 'Em andamento', tone: 'blue' },
  suspenso: { label: 'Suspenso', tone: 'orange' },
  arquivado: { label: 'Arquivado', tone: 'neutral' },
  encerrado: { label: 'Encerrado', tone: 'green' },
};

export const prioridadeEventoMeta: Record<PrioridadeEvento, StatusMeta> = {
  urgente: { label: 'Urgente', tone: 'red' },
  atencao: { label: 'Atenção', tone: 'orange' },
  normal: { label: 'Normal', tone: 'green' },
};

export const tipoEventoMeta: Record<TipoEvento, { label: string; emoji: string }> = {
  prazo: { label: 'Prazo', emoji: '🔴' },
  audiencia: { label: 'Audiência', emoji: '🟠' },
  reuniao: { label: 'Reunião', emoji: '🟢' },
  tarefa: { label: 'Tarefa', emoji: '🔵' },
};

export const lancamentoStatusMeta: Record<StatusLancamento, StatusMeta> = {
  pago: { label: 'Pago', tone: 'green' },
  pendente: { label: 'Pendente', tone: 'orange' },
  atrasado: { label: 'Atrasado', tone: 'red' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
};
