import type { ID } from './common';

export type UserRole =
  | 'admin'
  | 'gestor'
  | 'operador'
  | 'financeiro'
  | 'contador'
  | 'vendedor';

export type UsuarioStatus = 'ativo' | 'inativo' | 'pendente_convite';

export interface Usuario {
  id: ID;
  nome: string;
  nomeExibicao: string;
  iniciais: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  telefone?: string;
  /**
   * IDs das empresas/tenants às quais este usuário pertence diretamente.
   */
  tenantIds: ID[];
  /**
   * ID do tenant atualmente selecionado na sessão de trabalho do usuário.
   */
  tenantAtivoId?: ID;
  /**
   * Registro Profissional no Conselho Regional de Contabilidade (preenchido para role === 'contador').
   */
  crc?: string;
  /**
   * Nome ou razão social do escritório contábil ao qual o usuário pertence (se aplicável).
   */
  escritorioContabilNome?: string;
  /**
   * Lista de IDs de tenants sob a gestão contábil deste contador/escritório.
   * Quando `role === 'contador'`, o usuário tem visão gerencial e fiscal
   * sobre todas as empresas listadas em seu portfólio.
   */
  portfolioTenantIds?: ID[];
  ativo: boolean;
  status?: UsuarioStatus;
  criadoEm: string;
  ultimoAcesso?: string;
}

export interface UsuarioFiltros {
  busca?: string;
  role?: UserRole | 'todos';
  tenantId?: ID | 'todos';
  ativo?: boolean;
}
