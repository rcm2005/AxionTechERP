import { http } from './http';
import { USE_MOCKS } from './mockAdapter';

export type InterpretacaoOnboarding =
  | { disponivel: false }
  | { disponivel: true; tipo: 'juridico' | 'outro' | 'generico'; termo?: string; nomeEscritorioSugerido?: string };

export type PatchCampo = 'nomeEscritorio' | 'cnpjOuCpf' | 'corPrimaria' | 'adminNome' | 'adminEmail';

export type RevisaoResultado = {
  intent: 'confirmar' | 'patch' | 'recomecar' | 'incerto';
  patches: Array<{ campo: PatchCampo; valor: string }>;
  resumoAmigavel: string | null;
};

/**
 * Classifies the initial onboarding message using the AI backend.
 * In case of mock, timeout or network error, returns `{ disponivel: false }`
 * without throwing so the caller can use the deterministic local fallback.
 */
export async function interpretRequest(text: string): Promise<InterpretacaoOnboarding> {
  if (USE_MOCKS) {
    return { disponivel: false };
  }
  try {
    const { data } = await http.post<InterpretacaoOnboarding>('/onboarding/interpretar', { texto: text });
    return data;
  } catch {
    return { disponivel: false };
  }
}

/**
 * Sends freeform text in the onboarding confirmation step to identify
 * whether the user confirmed, wants to restart, or requested corrections to specific fields.
 * In case of mock, timeout or network error, returns `null` without throwing.
 */
export async function reviewConfirmation(
  text: string,
  currentData: Record<PatchCampo, string>,
): Promise<RevisaoResultado | null> {
  if (USE_MOCKS) {
    return null;
  }
  try {
    const { data } = await http.post<RevisaoResultado>('/onboarding/revisar', {
      texto: text,
      dadosAtuais: currentData,
    });
    return data;
  } catch {
    return null;
  }
}

export interface RequisitoCobertura {
  id: string;
  descricao: string;
}

export interface ResultadoCobertura {
  cobertos: RequisitoCobertura[];
  descobertos: RequisitoCobertura[];
}

export async function getRetailDiagnosis(
  answers: Record<string, unknown>
): Promise<ResultadoCobertura | null> {
  if (USE_MOCKS) return null;
  try {
    const { data } = await http.post<ResultadoCobertura>('/onboarding/diagnostico-varejo', { respostas: answers });
    return data;
  } catch {
    return null;
  }
}
