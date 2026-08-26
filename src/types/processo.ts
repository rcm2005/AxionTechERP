import type { ID } from './common';

export type ProcessoStatus = 'em_andamento' | 'suspenso' | 'arquivado' | 'encerrado';

export type AreaJuridica =
  | 'civel'
  | 'trabalhista'
  | 'tributario'
  | 'familia'
  | 'consumidor'
  | 'empresarial'
  | 'penal';

export interface Processo {
  id: ID;
  numeroCnj: string;
  numeroCurto: string;
  titulo: string;
  area: AreaJuridica;
  status: ProcessoStatus;
  faseProcessual: string;
  clienteId: ID;
  parteContraria: string;
  tribunal: string;
  vara: string;
  advogadoId: ID;
  valorCausaCentavos: number;
  distribuidoEm: string;
  proximoPrazo?: string;
  proximaAudiencia?: string;
  qtdDocumentos: number;
  qtdDocumentosPendentes: number;
}

export interface Andamento {
  id: ID;
  processoId: ID;
  data: string;
  titulo: string;
  descricao: string;
}
