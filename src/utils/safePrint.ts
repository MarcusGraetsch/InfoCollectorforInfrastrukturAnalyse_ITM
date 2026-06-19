/** Escapes HTML special chars to prevent XSS in generated print windows. */
export function esc(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Opens a print window with safe HTML. baseStyles is optional additional CSS. */
export function openPrintWindow(title: string, bodyHtml: string, baseStyles = ''): void {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
    <title>${esc(title)}</title>
    <style>
      body{font-family:sans-serif;padding:2rem;color:#1a2340}
      h1{font-size:1.4rem;color:#1a2340}h2{font-size:1.1rem;margin-top:1.5rem}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #d1d5db;padding:0.4rem 0.6rem;text-align:left;font-size:0.85rem}
      th{background:#f3f4f6;font-weight:600}
      .print-header{border-bottom:2px solid #1a2340;padding-bottom:0.75rem;margin-bottom:1.5rem}
      .print-header h1{margin:0 0 0.25rem}
      .print-meta{font-size:0.8rem;color:#6b7280}
      .print-footer{margin-top:2rem;padding-top:0.5rem;border-top:1px solid #e5e7eb;font-size:0.75rem;color:#9ca3af}
      @media print{body{padding:0}}
      ${baseStyles}
    </style></head><body>${bodyHtml}<script>window.print();<\/script></body></html>`);
  win.document.close();
}

/**
 * Builds a standard print header block with customer name + date.
 * customerName and title are automatically escaped.
 */
export function printHeader(title: string, customerName: string): string {
  const date = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="print-header">
    <h1>${esc(title)}</h1>
    <div class="print-meta">${esc(customerName) || 'Kein Kunde angegeben'} &middot; Stand: ${esc(date)}</div>
  </div>`;
}

/** Standard print footer with branding. */
export function printFooter(): string {
  return `<div class="print-footer">Erstellt mit HiSolutions IT-Strukturanalyse &middot; ${new Date().toLocaleDateString('de-DE')}</div>`;
}
