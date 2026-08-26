import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function formatDayMonth(iso: string): string {
  return format(parseISO(iso), 'dd/MM');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatLongDate(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatMonthYear(iso: string): string {
  return format(parseISO(iso), 'MMMM yyyy', { locale: ptBR });
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}
