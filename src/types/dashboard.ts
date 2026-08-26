import type { Tone } from './common';

export interface KpiResumo {
  id: string;
  label: string;
  valor: string;
  sub?: string;
  subTone?: Tone;
  variacaoPercentual?: number;
  tipo?: 'financeiro' | 'estoque' | 'vendas' | 'fiscal';
}

export interface Alerta {
  id: string;
  titulo: string;
  descricao: string;
  tone: 'warning' | 'danger';
  modulo?: 'fiscal' | 'financeiro' | 'estoque' | 'compliance';
  link?: string;
}
