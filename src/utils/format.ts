import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Normaliza um valor digitado pelo usuário para o decimal-string que o backend
 * jurídico espera ("15000.00").
 *
 * Aceita as duas grafias que aparecem na prática: pt-BR ("15.000,00" — vírgula
 * decimal, ponto de milhar) e a do próprio contrato ("15000.00"). A vírgula é o
 * que decide: se existe, o ponto é separador de milhar; se não existe, o ponto é
 * o separador decimal. Valor vazio/ilegível vira `fallback`.
 */
export function normalizarDecimal(valor: string, fallback = '0.00'): string {
  const limpo = valor.trim();
  if (!limpo) return fallback;
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return fallback;
  return numero.toFixed(2);
}

/**
 * Formata um decimal serializado como string ("15000.00"), que é como o
 * backend jurídico trafega valores monetários — ao contrário dos módulos
 * legados mockados, que usam inteiros em centavos (`formatBRL`).
 * Retorna '—' para valor ausente ou não numérico, em vez de "R$ NaN".
 */
export function formatBRLDecimal(valor: string | null | undefined): string {
  if (valor == null || valor === '') return '—';
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
