import type { ID, Endereco } from './common';

export type RamoAtividade = 'industria' | 'varejo' | 'servicos' | 'distribuicao' | 'agro';

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei';

export type TenantStatus = 'ativo' | 'inativo' | 'bloqueado' | 'onboarding';

export type PlanoSaaS = 'starter' | 'pro' | 'enterprise' | 'contador_partner';

export interface Tenant {
  id: ID;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  ramo: RamoAtividade;
  regimeTributario: RegimeTributario;
  contadorParceiroId?: ID;
  email: string;
  telefone: string;
  endereco: Endereco;
  status: TenantStatus;
  plano: PlanoSaaS;
  logoUrl?: string;
  limiteUsuarios?: number;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface TenantFiltros {
  busca?: string;
  ramo?: RamoAtividade | 'todos';
  status?: TenantStatus | 'todos';
  contadorParceiroId?: ID;
}
