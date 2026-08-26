import type { ID } from './common';

export type TipoLancamento = 'receita' | 'despesa';
export type StatusLancamento = 'pago' | 'pendente' | 'atrasado' | 'cancelado';

export interface Lancamento {
  id: ID;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string;
  clienteId?: ID;
  processoId?: ID;
  valorCentavos: number;
  vencimento: string;
  pagoEm?: string;
  status: StatusLancamento;
  parcela?: { numero: number; total: number };
}
