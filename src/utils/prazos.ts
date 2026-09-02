import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import type { Prazo, PrazoStatus } from '@/types';
import type { Tone } from '@/types';

/** Window (in days) in which a pending fatal deadline is treated as urgent. */
export const URGENCY_WINDOW_DAYS = 3;

export type DeadlineUrgencyLevel = 'vencido' | 'urgente' | 'proximo' | 'tranquilo' | 'encerrado';

export interface DeadlineUrgency {
  urgencyLevel: DeadlineUrgencyLevel;
  /** Negative = already overdue. 0 = due today. */
  remainingDays: number;
  tone: Tone;
  label: string;
}

/**
 * Classifies a FATAL deadline relative to today.
 *
 * Deadlines already completed/lost do not receive urgency styling — the
 * visual highlight exists to prompt action, and there is no possible action on them.
 * Uses real system date (not REFERENCE_DATE from mocks) because the value
 * of the feature depends on being anchored in the user's true "today".
 */
export function classifyDeadline(deadline: Prazo, today: Date = new Date()): DeadlineUrgency {
  const remainingDays = daysUntilDeadline(deadline.prazo_fatal, today);

  if (deadline.status !== 'pendente') {
    return {
      urgencyLevel: 'encerrado',
      remainingDays,
      tone: deadline.status === 'cumprido' ? 'green' : 'red',
      label: deadline.status === 'cumprido' ? 'Cumprido' : 'Perdido',
    };
  }

  if (remainingDays < 0) {
    return {
      urgencyLevel: 'vencido',
      remainingDays,
      tone: 'red',
      label: `Vencido há ${Math.abs(remainingDays)} d`,
    };
  }
  if (remainingDays === 0) {
    return { urgencyLevel: 'urgente', remainingDays, tone: 'red', label: 'Vence hoje' };
  }
  if (remainingDays <= URGENCY_WINDOW_DAYS) {
    return {
      urgencyLevel: 'urgente',
      remainingDays,
      tone: 'red',
      label: `Faltam ${remainingDays} d`,
    };
  }
  if (remainingDays <= 10) {
    return { urgencyLevel: 'proximo', remainingDays, tone: 'orange', label: `Faltam ${remainingDays} d` };
  }
  return { urgencyLevel: 'tranquilo', remainingDays, tone: 'neutral', label: `Faltam ${remainingDays} d` };
}

/** Calendar days between today and a "YYYY-MM-DD" date. */
export function daysUntilDeadline(isoDate: string, today: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(parseISO(isoDate)), startOfDay(today));
}

export const deadlineStatusMeta: Record<PrazoStatus, { label: string; tone: Tone }> = {
  pendente: { label: 'Pendente', tone: 'blue' },
  cumprido: { label: 'Cumprido', tone: 'green' },
  perdido: { label: 'Perdido', tone: 'red' },
};
