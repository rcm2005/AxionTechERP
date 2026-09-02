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
 * Classifica a primeira mensagem do onboarding usando o backend de IA.
 * Em caso de mock, timeout ou erro de rede, devolve `{ disponivel: false }`
 * sem subir exceção para que o chamador use o fallback determinístico local.
 */
export async function interpretarPedido(texto: string): Promise<InterpretacaoOnboarding> {
  if (USE_MOCKS) {
    return { disponivel: false };
  }
  try {
    const { data } = await http.post<InterpretacaoOnboarding>('/onboarding/interpretar', { texto });
    return data;
  } catch {
    return { disponivel: false };
  }
}

/**
 * Envia texto livre na etapa de confirmação do onboarding para identificar
 * se o usuário confirmou, quer recomeçar ou pediu correção de campos específicos.
 * Em caso de mock, timeout ou erro de rede, devolve `null` sem subir exceção.
 */
export async function revisarConfirmacao(
  texto: string,
  dadosAtuais: Record<PatchCampo, string>,
): Promise<RevisaoResultado | null> {
  if (USE_MOCKS) {
    return null;
  }
  try {
    const { data } = await http.post<RevisaoResultado>('/onboarding/revisar', {
      texto,
      dadosAtuais,
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

export async function diagnosticoVarejo(
  respostas: Record<string, unknown>
): Promise<ResultadoCobertura | null> {
  if (USE_MOCKS) return null;
  try {
    const { data } = await http.post<ResultadoCobertura>('/onboarding/diagnostico-varejo', { respostas });
    return data;
  } catch {
    return null;
  }
}
