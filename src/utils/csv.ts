/** Escapes a single CSV field: wraps in quotes and doubles internal quotes when the value
 * contains a comma, quote, or newline. */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Builds a CSV string from headers + rows and triggers a real browser download (Blob + object
 * URL). No backend call — the data is whatever the caller already has loaded.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers, ...rows].map((line) =>
    line.map((cell) => escapeCsvField(String(cell))).join(','),
  );
  // BOM (\uFEFF) so Excel opens UTF-8 accented characters correctly.
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
