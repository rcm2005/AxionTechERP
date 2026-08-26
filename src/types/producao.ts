import type { ID } from './common';
import type { UnidadeMedida } from './produto';

export type OrdemProducaoStatus = 'planejada' | 'em_producao' | 'concluida' | 'cancelada';

export interface FichaTecnicaItem {
  produtoInsumoId: ID;
  quantidade: number;
  unidade: UnidadeMedida | string;
  perdaPercentual?: number;
  observacoes?: string;
}

export interface FichaTecnica {
  id: ID;
  tenantId: ID;
  codigo?: string;
  produtoAcabadoId: ID;
  descricao: string;
  versao?: string;
  tempoEstimadoMinutos?: number;
  itens: FichaTecnicaItem[];
  ativo?: boolean;
  observacoes?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CustosProducao {
  materiaPrimaCentavos: number;
  maoDeObraCentavos?: number;
  custosIndiretosCentavos?: number;
  totalCentavos: number;
}

export interface OrdemProducao {
  id: ID;
  tenantId: ID;
  numeroOP?: string;
  fichaTecnicaId: ID;
  status: OrdemProducaoStatus;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  dataInicio?: string;
  dataFim?: string;
  custos?: CustosProducao | number;
  lote?: string;
  observacoes?: string;
  responsavelNome?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface OrdemProducaoFiltros {
  busca?: string;
  status?: OrdemProducaoStatus | 'todos';
  tenantId?: ID;
}

export interface FichaTecnicaFiltros {
  busca?: string;
  tenantId?: ID;
}

export interface ResumoProducao {
  totalOPs: number;
  emProducao: number;
  planejadas: number;
  concluidas: number;
  canceladas: number;
  totalFichas: number;
  totalProduzidoUnidades: number;
  custoTotalCentavos: number;
}
