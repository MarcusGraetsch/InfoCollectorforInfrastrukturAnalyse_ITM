import type * as XLSX from 'xlsx';
import type { AppState } from '../types';
import { getEffektiverSchutzbedarf } from '../schutzbedarfsVererbung';
import { CATEGORIES } from '../categories';
import { assessAll, summarize } from '../cloudReadiness';

// xlsx wird dynamisch geladen (~600 kB), damit der Initial-Bundle klein bleibt.
// Excel-Im-/Export wird erst bei Button-Klick gebraucht.
type XLSXModule = typeof import('xlsx');

/**
 * Neutralisiert CSV/Excel-Formel-Injection (OWASP CSV Injection).
 * Werte mit führendem = + - @ werden mit einem Apostroph vorangestellt,
 * damit Excel/LibreOffice sie als Text und nicht als Formel interpretiert.
 */
export function sanitizeCsvCell(val: unknown): string | number | boolean | null | undefined {
  if (val === null || val === undefined) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const s = String(val);
  if (/^[=+\-@|\t\r]/.test(s)) return `'${s}`;
  return s;
}

function sanitizeRow(row: unknown[]): unknown[] {
  return row.map(sanitizeCsvCell);
}

/** Tabellenfelder (FieldType 'table') werden als JSON-String gespeichert. */
function safeParseRows(raw: string): Record<string, unknown>[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addOverviewSheet(XLSX: XLSXModule, wb: XLSX.WorkBook, state: AppState, titel: string): void {
  const overviewData = [
    [titel, ''],
    ['Kunde:', state.customerName],
    ['Erstellt:', new Date().toLocaleString('de-DE')],
    ['', ''],
    ['Kategorie', 'Anzahl Einträge'],
    ...CATEGORIES.map((cat) => [cat.label, (state[cat.key] as unknown[]).length]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), 'Übersicht');
}

function addCategorySheets(XLSX: XLSXModule, wb: XLSX.WorkBook, state: AppState): void {
  for (const cat of CATEGORIES) {
    const items = state[cat.key] as unknown as Record<string, unknown>[];
    const headers = cat.fields.map((f) => f.label);
    const rows = items.map((item) =>
      cat.fields.map((f) => {
        const val = item[f.key];
        if (f.type === 'table') {
          const raw = typeof val === 'string' ? safeParseRows(val) : Array.isArray(val) ? (val as Record<string, unknown>[]) : [];
          const cols = f.tableColumns ?? [];
          return raw
            .map((r) => cols.map((c) => r[c.key] ?? '').join('|'))
            .join('; ');
        }
        if (Array.isArray(val)) return val.join(', ');
        return val ?? '';
      })
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(sanitizeRow)]);
    XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
  }
}

export async function exportToExcel(state: AppState): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  addOverviewSheet(XLSX, wb, state, 'IT Strukturanalyse');
  addCategorySheets(XLSX, wb, state);
  XLSX.writeFile(
    wb,
    `IT-Strukturanalyse_${state.customerName || 'Export'}_${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

/**
 * Workshop-Paket: Strukturanalyse + Cloud-Strategie-Rahmen + gelieferte
 * Unterlagen + automatische Cloud-Readiness-Bewertung. Dient als Grundlage
 * für den Cloud-Readiness-Workshop.
 */
export async function exportWorkshopPackage(state: AppState): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  addOverviewSheet(XLSX, wb, state, 'Cloud-Readiness Workshop-Paket');

  // Cloud-Strategie-Rahmen
  const cs = state.cloudStrategy;
  const strategyData = [
    ['Cloud-Strategie – Rahmen', ''],
    ['Geschäftliches Ziel', cs.ziel],
    ['Treiber', cs.treiber.join(', ')],
    ['Bevorzugte Zielumgebung', cs.zielumgebung.join(', ')],
    ['Zeithorizont', cs.zeithorizont],
    ['Notizen', cs.notizen],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(strategyData), 'Cloud-Strategie');

  // Cloud-Readiness-Bewertung
  const assessed = assessAll(state);
  const summary = summarize(assessed);
  const readinessHeader = [
    'Kürzel',
    'Name',
    'Typ',
    'Schutzbedarf',
    'Datensouveränität',
    'Aktuelle Bereitstellung',
    'Lebenszyklus',
    'Readiness-Score',
    'Readiness-Level',
    'Empfehlung (6R)',
    'Souveräne Cloud nötig',
    'Begründung',
  ];
  const readinessRows = assessed.map((i) => [
    i.kuerzel,
    i.name,
    i.categoryLabel,
    getEffektiverSchutzbedarf(i) || '',
    i.datensouveraenitaet ?? '',
    i.bereitstellung ?? '',
    i.lebenszyklus ?? '',
    i.result.score,
    i.result.level,
    i.result.empfehlung,
    i.result.souveraen ? 'Ja' : 'Nein',
    i.result.begruendung.join(' '),
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([readinessHeader, ...readinessRows.map(sanitizeRow)]),
    'Cloud-Readiness'
  );

  // Readiness-Zusammenfassung
  const summaryData = [
    ['Cloud-Readiness – Zusammenfassung', ''],
    ['Objekte gesamt', summary.total],
    ['Bewertet', summary.bewertet],
    ['Noch nicht bewertet', summary.unbewertet],
    ['Durchschnittlicher Score', summary.avgScore],
    ['Cloud-ready (Hoch)', summary.hoch],
    ['Bedingt (Mittel)', summary.mittel],
    ['Niedrig', summary.niedrig],
    ['Souveräne Cloud erforderlich', summary.souveraen],
    ['', ''],
    ['Empfohlene Strategie (6R)', 'Anzahl'],
    ...Object.entries(summary.dispositionCounts),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Readiness-Summary');

  // Gelieferte Unterlagen
  const docHeader = ['Bezeichnung', 'Art', 'Erhalten am', 'Ausgewertet', 'Notiz'];
  const docRows = state.quelldokumente.map((d) => [
    d.name,
    d.art,
    d.erhaltenAm,
    d.ausgewertet ? 'Ja' : 'Nein',
    d.notiz,
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([docHeader, ...docRows.map(sanitizeRow)]),
    'Unterlagen'
  );

  addCategorySheets(XLSX, wb, state);

  XLSX.writeFile(
    wb,
    `Cloud-Readiness-Workshop_${state.customerName || 'Export'}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
  );
}
