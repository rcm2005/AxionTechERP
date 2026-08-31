import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import type { Prazo, PrazoStatus } from '@/types';
import type { Tone } from '@/types';

/** Janela (em dias) em que um prazo fatal pendente passa a ser tratado como urgente. */
export const JANELA_URGENCIA_DIAS = 3;

export type UrgenciaPrazo = 'vencido' | 'urgente' | 'proximo' | 'tranquilo' | 'encerrado';

export interface PrazoUrgencia {
  urgencia: UrgenciaPrazo;
  /** Negativo = já venceu. 0 = vence hoje. */
  diasRestantes: number;
  tone: Tone;
  label: string;
}

/**
 * Classifica um prazo FATAL em relação a hoje.
 *
 * Prazos já cumpridos/perdidos não recebem tratamento de urgência — o
 * destaque visual existe para provocar ação, e não há ação possível neles.
 * Usa data real do sistema (não a REFERENCE_DATE dos mocks) porque o valor
 * do recurso depende de estar ancorado no "hoje" verdadeiro do usuário.
 */
export function classificarPrazo(prazo: Prazo, hoje: Date = new Date()): PrazoUrgencia {
  const diasRestantes = diasAtePrazo(prazo.prazo_fatal, hoje);

  if (prazo.status !== 'pendente') {
    return {
      urgencia: 'encerrado',
      diasRestantes,
      tone: prazo.status === 'cumprido' ? 'green' : 'red',
      label: prazo.status === 'cumprido' ? 'Cumprido' : 'Perdido',
    };
  }

  if (diasRestantes < 0) {
    return {
      urgencia: 'vencido',
      diasRestantes,
      tone: 'red',
      label: `Vencido há ${Math.abs(diasRestantes)} d`,
    };
  }
  if (diasRestantes === 0) {
    return { urgencia: 'urgente', diasRestantes, tone: 'red', label: 'Vence hoje' };
  }
  if (diasRestantes <= JANELA_URGENCIA_DIAS) {
    return {
      urgencia: 'urgente',
      diasRestantes,
      tone: 'red',
      label: `Faltam ${diasRestantes} d`,
    };
  }
  if (diasRestantes <= 10) {
    return { urgencia: 'proximo', diasRestantes, tone: 'orange', label: `Faltam ${diasRestantes} d` };
  }
  return { urgencia: 'tranquilo', diasRestantes, tone: 'neutral', label: `Faltam ${diasRestantes} d` };
}

/** Dias corridos entre hoje e uma data "YYYY-MM-DD". */
export function diasAtePrazo(dataIso: string, hoje: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(parseISO(dataIso)), startOfDay(hoje));
}

export const prazoStatusMeta: Record<PrazoStatus, { label: string; tone: Tone }> = {
  pendente: { label: 'Pendente', tone: 'blue' },
  cumprido: { label: 'Cumprido', tone: 'green' },
  perdido: { label: 'Perdido', tone: 'red' },
};
