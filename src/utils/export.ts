import * as XLSX from 'xlsx';
import type { AppState } from '../types';
import { CATEGORIES } from '../categories';
import { assessAll, summarize } from '../cloudReadiness';

function addOverviewSheet(wb: XLSX.WorkBook, state: AppState, titel: string): void {
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

function addCategorySheets(wb: XLSX.WorkBook, state: AppState): void {
  for (const cat of CATEGORIES) {
    const items = state[cat.key] as unknown as Record<string, unknown>[];
    const headers = cat.fields.map((f) => f.label);
    const rows = items.map((item) =>
      cat.fields.map((f) => {
        const val = item[f.key];
        if (Array.isArray(val)) return val.join(', ');
        return val ?? '';
      })
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, cat.label.substring(0, 31));
  }
}

export function exportToExcel(state: AppState): void {
  const wb = XLSX.utils.book_new();
  addOverviewSheet(wb, state, 'IT Strukturanalyse');
  addCategorySheets(wb, state);
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
export function exportWorkshopPackage(state: AppState): void {
  const wb = XLSX.utils.book_new();
  addOverviewSheet(wb, state, 'Cloud-Readiness Workshop-Paket');

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
    i.schutzbedarf ?? '',
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
    XLSX.utils.aoa_to_sheet([readinessHeader, ...readinessRows]),
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
    XLSX.utils.aoa_to_sheet([docHeader, ...docRows]),
    'Unterlagen'
  );

  addCategorySheets(wb, state);

  XLSX.writeFile(
    wb,
    `Cloud-Readiness-Workshop_${state.customerName || 'Export'}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`
  );
}
