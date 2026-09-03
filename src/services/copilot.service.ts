import { http } from './http';

export type TipoAtoIntimacao =
  | 'contestacao'
  | 'apelacao'
  | 'embargos_declaracao'
  | 'agravo_instrumento'
  | 'contrarrazoes'
  | 'replica'
  | 'desconhecido';

export type NivelConfianca = 'alta' | 'media' | 'baixa';

/** Plain-Portuguese label for each act type — the single source of truth, reused by
 * `AnalisePrazoCard` (display) and by `CopilotPage` (pre-filling `NovoPrazoModal`'s description). */
export const ROTULO_TIPO_ATO: Record<TipoAtoIntimacao, string> = {
  contestacao: 'Contestação',
  apelacao: 'Apelação',
  embargos_declaracao: 'Embargos de Declaração',
  agravo_instrumento: 'Agravo de Instrumento',
  contrarrazoes: 'Contrarrazões',
  replica: 'Réplica',
  desconhecido: 'Ato não identificado',
};

export interface AnaliseIntimacao {
  ok: true;
  numero_cnj: string | null;
  tribunal: string | null;
  vara: string | null;
  tipo_ato: TipoAtoIntimacao;
  data_intimacao: string | null;
  prazo_fatal: string | null;
  confianca: NivelConfianca;
  explicacao_contagem: string;
}

export interface AnaliseIntimacaoFalha {
  ok: false;
  motivo: 'input_suspeito' | 'texto_vazio';
}

export type ResultadoAnaliseIntimacao = AnaliseIntimacao | AnaliseIntimacaoFalha;

/**
 * Calls the real backend analyzer. Deliberately does NOT catch/swallow errors here (unlike
 * `onboarding.service.ts`'s `interpretRequest`) — a thrown error (network failure, the route not
 * being deployed yet, a 500) is a materially different situation from a resolved
 * `{ ok: false, motivo }` response, and the caller (`CopilotPage`) must show a different message
 * for each. Do not add a `USE_MOCKS` branch here — there is no honest local mock for a real legal
 * deadline computation; showing a canned response as if it were real is exactly what this
 * checkpoint exists to remove (see the file header for the ADR 0001 / X-04 context).
 */
export async function analisarIntimacao(texto: string): Promise<ResultadoAnaliseIntimacao> {
  const { data } = await http.post<ResultadoAnaliseIntimacao>('/copilot/analisar-intimacao', { texto });
  return data;
}
