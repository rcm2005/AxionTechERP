/**
 * Número único do processo (Resolução CNJ 65/2008):
 * NNNNNNN-DD.AAAA.J.TR.OOOO
 *   NNNNNNN sequencial • DD dígito verificador • AAAA ano
 *   J segmento do judiciário • TR tribunal • OOOO unidade de origem
 *
 * Validamos apenas o FORMATO no cliente. O dígito verificador (módulo 97
 * base 10) é responsabilidade do backend — duplicar essa regra aqui criaria
 * duas fontes de verdade para uma validação que pode mudar.
 */
export const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

export const CNJ_PLACEHOLDER = '0000000-00.0000.0.00.0000';

export function isCnjValido(valor: string): boolean {
  return CNJ_REGEX.test(valor.trim());
}

/**
 * Aplica a máscara CNJ progressivamente enquanto o usuário digita.
 * Aceita entrada já mascarada (reaproveita só os dígitos) e trunca em 20.
 */
export function aplicarMascaraCnj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 20);
  if (d.length <= 7) return d;
  if (d.length <= 9) return `${d.slice(0, 7)}-${d.slice(7)}`;
  if (d.length <= 13) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`;
  if (d.length <= 14) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`;
  if (d.length <= 16)
    return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14)}`;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`;
}
