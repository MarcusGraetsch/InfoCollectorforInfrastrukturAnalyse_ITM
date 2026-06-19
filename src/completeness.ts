import type { AppState, CategoryKey } from './types';
import { ASSESSABLE_CATEGORIES } from './cloudReadiness';
import {
  CLOUD_FIELD_DEFS,
  isFieldRelevant,
  isOpenField,
} from './cloudFields';

/**
 * Erfassungsfortschritt je Kategorie — basiert auf den cloud-relevanten Feldern
 * (CLOUD_FIELD_DEFS) und der einheitlichen "offen = leer/Unklar"-Semantik aus
 * cloudFields.ts. EINE Quelle der Wahrheit, damit Cockpit und Fragenliste nie
 * voneinander abweichen.
 */
export type CompletenessStatus = 'Grün' | 'Gelb' | 'Rot';

export interface CategoryCompleteness {
  key: CategoryKey;
  label: string;
  total: number;        // Anzahl Einträge in der Kategorie
  withUnklar: number;   // Einträge mit ≥1 offenen Feld (leer/Unklar)
  empty: number;        // Einträge ganz ohne erfasste Cloud-Felder
  complete: number;     // Einträge ohne ein einziges offenes Feld
  pct: number;          // 0–100: Anteil erfasster Felder über alle Einträge
  status: CompletenessStatus;
}

const CATEGORY_LABEL: Record<string, string> = {
  anwendungen: 'Anwendungen',
  server: 'Server',
  clients: 'Clients',
  icsSysteme: 'ICS-Systeme',
  iotSysteme: 'IoT-Systeme',
};

function statusFor(pct: number, empty: number, total: number): CompletenessStatus {
  if (total === 0) return 'Rot';
  if (empty > 0 && pct < 40) return 'Rot';
  if (pct >= 80) return 'Grün';
  if (pct >= 40) return 'Gelb';
  return 'Rot';
}

/** Relevante Cloud-Feld-Definitionen für eine Kategorie. */
function relevantFieldCount(category: CategoryKey): number {
  return CLOUD_FIELD_DEFS.filter((def) => isFieldRelevant(def, category)).length;
}

export function computeCategoryCompleteness(
  state: AppState,
  category: CategoryKey
): CategoryCompleteness {
  const items = state[category] as unknown as Record<string, unknown>[];
  const relevantDefs = CLOUD_FIELD_DEFS.filter((def) => isFieldRelevant(def, category));
  const fieldsPerItem = relevantDefs.length;

  let withUnklar = 0;
  let empty = 0;
  let complete = 0;
  let filledFields = 0;
  const totalFields = items.length * fieldsPerItem;

  for (const item of items) {
    let openInItem = 0;
    for (const def of relevantDefs) {
      if (isOpenField(item[def.key])) openInItem++;
      else filledFields++;
    }
    if (openInItem > 0) withUnklar++;
    if (openInItem === fieldsPerItem) empty++;
    if (openInItem === 0) complete++;
  }

  const pct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return {
    key: category,
    label: CATEGORY_LABEL[category] ?? category,
    total: items.length,
    withUnklar,
    empty,
    complete,
    pct,
    status: statusFor(pct, empty, items.length),
  };
}

export function computeCompleteness(state: AppState): CategoryCompleteness[] {
  return ASSESSABLE_CATEGORIES.map((cat) => computeCategoryCompleteness(state, cat));
}

export interface OverallCompleteness {
  categoriesTotal: number;
  categoriesComplete: number;   // Kategorien mit Status Grün
  categoriesWithItems: number;  // Kategorien mit ≥1 Eintrag
  itemsTotal: number;
  itemsWithUnklar: number;
  avgPct: number;               // gewichteter Felder-Fortschritt über alle Einträge
}

export function summarizeCompleteness(rows: CategoryCompleteness[]): OverallCompleteness {
  const withItems = rows.filter((r) => r.total > 0);
  const itemsTotal = rows.reduce((s, r) => s + r.total, 0);
  const itemsWithUnklar = rows.reduce((s, r) => s + r.withUnklar, 0);

  // Gewichteter Durchschnitt nach Anzahl Einträge × relevanter Felder
  let filledWeight = 0;
  let totalWeight = 0;
  for (const r of rows) {
    const fields = relevantFieldCount(r.key) * r.total;
    totalWeight += fields;
    filledWeight += (r.pct / 100) * fields;
  }

  return {
    categoriesTotal: rows.length,
    categoriesComplete: rows.filter((r) => r.status === 'Grün').length,
    categoriesWithItems: withItems.length,
    itemsTotal,
    itemsWithUnklar,
    avgPct: totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0,
  };
}
