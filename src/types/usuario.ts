import type { ID } from './common';

export type UserRole = 'socio' | 'advogado' | 'estagiario' | 'financeiro' | 'admin';

export interface Usuario {
  id: ID;
  nome: string;
  nomeExibicao: string;
  iniciais: string;
  email: string;
  role: UserRole;
  oab?: string;
  ativo: boolean;
}
