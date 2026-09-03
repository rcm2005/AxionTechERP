import type { ID } from './common';

export type PrazoStatus = 'pendente' | 'cumprido' | 'perdido';

/**
 * `manual` é o único valor que a UI produz. `automatico` existe no contrato do
 * backend, reservado para uma futura integração de captura de publicações —
 * a UI apenas exibe, nunca cria.
 */
export type PrazoOrigem = 'manual' | 'automatico';

export interface Prazo {
  id: ID;
  processo_id: ID;
  descricao: string;
  /** "YYYY-MM-DD" */
  data_intimacao?: string | null;
  /**
   * "YYYY-MM-DD" — prazo FATAL: se perdido, extingue o direito processual.
   * Não confundir com lembrete interno. É o campo que a UI destaca.
   */
  prazo_fatal: string;
  dias_uteis?: number | null;
  /**
   * Human-readable Portuguese explanation of the business-day count behind
   * `prazo_fatal` (which holidays/recess days were excluded, etc.) —
   * computed server-side by the same `buildExplicacaoContagem` function the
   * Copilot's `AnaliseIntimacao.explicacao_contagem` uses (see
   * `src/components/copilot/AnalisePrazoCard.tsx`); same field name, same
   * authoring function, deliberately, so the two screens never disagree.
   * `null` when `data_intimacao` or `dias_uteis` is missing on this prazo
   * (nothing to reconstruct); `undefined` in mock mode.
   */
  explicacao_contagem?: string | null;
  origem: PrazoOrigem;
  status: PrazoStatus;
  created_at?: string;
  updated_at?: string;
}

export type PrazoInput = Omit<Prazo, 'id' | 'created_at' | 'updated_at'>;

export interface PrazoFiltros {
  processo_id?: string;
  status?: PrazoStatus | 'todos';
}
