/**
 * Unique case number (CNJ Resolution 65/2008):
 * NNNNNNN-DD.AAAA.J.TR.OOOO
 *   NNNNNNN sequential • DD check digit • AAAA year
 *   J judiciary segment • TR court • OOOO originating unit
 *
 * We only validate the FORMAT on the client. The check digit (modulo 97
 * base 10) is the backend's responsibility — duplicating that rule here would
 * create two sources of truth for a validation that may change.
 */
export const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

export const CNJ_PLACEHOLDER = '0000000-00.0000.0.00.0000';

export function isCnjValid(value: string): boolean {
  return CNJ_REGEX.test(value.trim());
}

/**
 * Progressively applies the CNJ mask as the user types.
 * Accepts already-masked input (reuses only the digits) and truncates at 20.
 */
export function applyCnjMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  if (digits.length <= 7) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9)}`;
  if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`;
  if (digits.length <= 16)
    return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14)}`;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
}
