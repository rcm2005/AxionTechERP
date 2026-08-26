import type {
  PessoaStatus,
  SituacaoCredito,
  StatusLancamento,
  TipoRelacao,
  Tone,
} from '@/types';

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const pessoaStatusMeta: Record<PessoaStatus, StatusMeta> = {
  ativo: { label: 'Ativo', tone: 'green' },
  inativo: { label: 'Inativo', tone: 'orange' },
  bloqueado: { label: 'Bloqueado', tone: 'red' },
  prospect: { label: 'Prospect', tone: 'blue' },
};

export const situacaoCreditoMeta: Record<SituacaoCredito, StatusMeta> = {
  aprovado: { label: 'Crédito aprovado', tone: 'green' },
  em_analise: { label: 'Em análise', tone: 'orange' },
  bloqueado: { label: 'Crédito bloqueado', tone: 'red' },
  inadimplente: { label: 'Inadimplente', tone: 'red' },
  sem_limite: { label: 'Sem limite', tone: 'neutral' },
};

export const tipoRelacaoMeta: Record<TipoRelacao, { label: string; tone: Tone }> = {
  cliente: { label: 'Cliente', tone: 'blue' },
  fornecedor: { label: 'Fornecedor', tone: 'orange' },
  ambos: { label: 'Cliente & Fornecedor', tone: 'green' },
  transportadora: { label: 'Transportadora', tone: 'neutral' },
};

export const lancamentoStatusMeta: Record<StatusLancamento, StatusMeta> = {
  pago: { label: 'Pago', tone: 'green' },
  pendente: { label: 'Pendente', tone: 'orange' },
  atrasado: { label: 'Atrasado', tone: 'red' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
  parcial: { label: 'Parcial', tone: 'blue' },
};
