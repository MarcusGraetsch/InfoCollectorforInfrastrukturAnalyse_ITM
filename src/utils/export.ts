import * as XLSX from 'xlsx';
import type { AppState } from '../types';
import { CATEGORIES } from '../categories';

export function exportToExcel(state: AppState): void {
  const wb = XLSX.utils.book_new();

  // Overview sheet
  const overviewData = [
    ['IT Strukturanalyse', ''],
    ['Kunde:', state.customerName],
    ['Erstellt:', new Date().toLocaleString('de-DE')],
    ['', ''],
    ['Kategorie', 'Anzahl Einträge'],
    ...CATEGORIES.map((cat) => [cat.label, (state[cat.key] as unknown[]).length]),
  ];
  const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Übersicht');

  // One sheet per category
  for (const cat of CATEGORIES) {
    const items = state[cat.key] as unknown as Record<string, unknown>[];
    if (items.length === 0) {
      const headers = cat.fields.map((f) => f.label);
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
      continue;
    }

    const headers = cat.fields.map((f) => f.label);
    const rows = items.map((item) =>
      cat.fields.map((f) => {
        const val = item[f.key];
        if (Array.isArray(val)) return val.join(', ');
        return val ?? '';
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1D4ED8' } },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
  }

  const filename = `IT-Strukturanalyse_${state.customerName || 'Export'}_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;

  XLSX.writeFile(wb, filename);
}
