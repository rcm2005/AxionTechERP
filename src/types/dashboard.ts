import type { Tone } from './common';

export interface KpiResumo {
  id: string;
  label: string;
  valor: string;
  sub?: string;
  subTone?: Tone;
}

export interface Alerta {
  id: string;
  titulo: string;
  descricao: string;
  tone: 'warning' | 'danger';
}
