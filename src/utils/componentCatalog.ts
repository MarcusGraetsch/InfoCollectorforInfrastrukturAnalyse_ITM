import type { ComponentCatalogEntry, ComponentKind } from '../data/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';
import type { CategoryDef, FieldDef } from '../categories';

/**
 * Kundenspezifische Katalogeinträge (Custom Catalog). Werden zur Laufzeit aus
 * `AppState.customComponentCatalog` registriert (App.tsx) und in allen
 * Such-/Filter-/Statistik-Funktionen mit dem statischen Basiskatalog
 * zusammengeführt — so erscheinen sie auch im ComponentPicker und in der
 * globalen Suche. Persistenz/Export laufen über den AppState (store.ts).
 */
let CUSTOM_CATALOG: ComponentCatalogEntry[] = [];

/** Registriert die Custom-Einträge (idempotent; aus dem AppState gespeist). */
export function setCustomCatalog(entries: ComponentCatalogEntry[] | undefined | null): void {
  CUSTOM_CATALOG = Array.isArray(entries) ? entries : [];
}

/** Aktuell registrierte Custom-Einträge. */
export function getCustomCatalog(): ComponentCatalogEntry[] {
  return CUSTOM_CATALOG;
}

/** Statischer Basiskatalog + Custom-Einträge (Custom hinten, gewinnt bei ID-Kollision in getById). */
export function effectiveCatalog(): ComponentCatalogEntry[] {
  return CUSTOM_CATALOG.length ? [...COMPONENT_CATALOG, ...CUSTOM_CATALOG] : COMPONENT_CATALOG;
}

/** True, wenn die ID zu einem Custom-Eintrag gehört (für UI-Markierung/Löschen). */
export function isCustomComponent(id: string): boolean {
  return CUSTOM_CATALOG.some(e => e.id === id);
}

const LICENSE_MAP: { needle: string; lizenztyp: string }[] = [
  { needle: 'open source', lizenztyp: 'Open Source (frei)' },
  { needle: 'subscription', lizenztyp: 'Subscription' },
  { needle: 'oem', lizenztyp: 'Proprietär (OEM)' },
  { needle: 'proprietär', lizenztyp: 'Proprietär (Volumenlizenz)' },
];

/** Builds the set of intended field values for an entry, before schema validation. */
function intendedFields(entry: ComponentCatalogEntry, version: string): Record<string, string> {
  const out: Record<string, string> = { ...entry.defaultFields };
  out.hersteller = entry.vendor;
  out.produktname = entry.product;
  out.name = entry.product;        // helps fill the required name field on new entries
  out.modell = out.modell ?? entry.product;
  if (version) {
    out.version = version;
    out.dbVersion = version;
  }
  // Derive a valid lizenztyp select value from the (free-text) license string.
  const lic = (entry.defaultFields.lizenzart ?? entry.defaultFields.lizenztyp ?? '').toLowerCase();
  if (lic) {
    const hit = LICENSE_MAP.find(m => lic.includes(m.needle));
    if (hit) out.lizenztyp = hit.lizenztyp;
  }
  // Drop phantom keys that are never real fields.
  delete out.lizenzart;
  delete out.betriebssystem;
  return out;
}

/**
 * Non-destructive, schema-validated autofill.
 * Only fills fields that exist in categoryDef, respects select options, and never overwrites.
 */
export function buildCatalogAutofill(
  entry: ComponentCatalogEntry,
  version: string,
  categoryDef: CategoryDef,
  currentValues: Record<string, unknown>
): { merged: Record<string, unknown>; filled: string[] } {
  const intended = intendedFields(entry, version);
  const byKey = new Map<string, FieldDef>();
  for (const f of categoryDef.fields) byKey.set(f.key, f);
  const merged = { ...currentValues };
  const filled: string[] = [];
  for (const [key, val] of Object.entries(intended)) {
    const def = byKey.get(key);
    if (!def) continue;                       // not a real field in this category
    if (def.type === 'select' && !(def.options ?? []).includes(val)) continue; // invalid option
    if (def.type === 'multiref' || def.type === 'table') continue;
    const cur = currentValues[key];
    if (cur !== undefined && cur !== null && cur !== '') continue; // never overwrite
    merged[key] = val;
    filled.push(key);
  }
  return { merged, filled };
}

export interface CatalogStats {
  total: number;
  byKind: { kind: ComponentKind; count: number }[];
  openSource: number;
  proprietary: number;
  oeffentlicherSektor: number;
  souveraen: number;       // tags include 'souverän' or de-relevante Cloud
  byRelevance: { de: number; eu: number; global: number; unspecified: number };
  ki: number;              // kind === 'ai'
  hardware: number;
  cloud: number;
}

/**
 * Aggregated, deterministic stats over the whole catalog (for the overview view).
 * Optional `catalogOverride` macht die Statistik reaktiv gegenüber Custom-Einträgen,
 * ohne auf die (ggf. einen Render verzögerte) globale Registry zu warten.
 */
export function getCatalogStats(catalogOverride?: ComponentCatalogEntry[]): CatalogStats {
  const kinds = new Map<ComponentKind, number>();
  let openSource = 0, proprietary = 0, oeffentlicherSektor = 0, souveraen = 0;
  const byRelevance = { de: 0, eu: 0, global: 0, unspecified: 0 };
  const catalog = catalogOverride ?? effectiveCatalog();
  for (const e of catalog) {
    kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
    const lic = (e.defaultFields.lizenzart ?? e.defaultFields.lizenztyp ?? '').toLowerCase();
    if (lic.includes('open source') || lic.includes('open-source') || lic.includes('open weights') || lic.includes('offener standard')) openSource++;
    else if (lic) proprietary++;
    if (e.oeffentlicherSektor) oeffentlicherSektor++;
    if ((e.tags ?? []).includes('souverän')) souveraen++;
    if (e.relevance === 'de') byRelevance.de++;
    else if (e.relevance === 'eu') byRelevance.eu++;
    else if (e.relevance === 'global') byRelevance.global++;
    else byRelevance.unspecified++;
  }
  const byKind = [...kinds.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);
  return {
    total: catalog.length,
    byKind,
    openSource,
    proprietary,
    oeffentlicherSektor,
    souveraen,
    byRelevance,
    ki: kinds.get('ai') ?? 0,
    hardware: kinds.get('hardware') ?? 0,
    cloud: kinds.get('cloud') ?? 0,
  };
}

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[\s\-_.]+/g, ' ').trim();
}

export function searchComponents(query: string, kind?: ComponentKind, limit = 20): ComponentCatalogEntry[] {
  if (!query || query.length < 2) return [];
  const q = normalizeText(query);
  return effectiveCatalog().filter(e => {
    if (kind && e.kind !== kind) return false;
    const haystack = normalizeText([e.vendor, e.product, ...(e.aliases ?? []), ...(e.tags ?? [])].join(' '));
    return haystack.includes(q);
  }).slice(0, limit);
}

export function getComponentById(id: string): ComponentCatalogEntry | undefined {
  // Custom-Einträge zuerst (gewinnen bei ID-Kollision), dann Basiskatalog.
  return CUSTOM_CATALOG.find(e => e.id === id) ?? COMPONENT_CATALOG.find(e => e.id === id);
}

export function getComponentSuggestionsForCategory(categoryKey: string, limit = 8): ComponentCatalogEntry[] {
  return effectiveCatalog().filter(e => e.categoryTargets.includes(categoryKey)).slice(0, limit);
}

/** Maps a catalog entry (+ optional chosen version) to form field key→value pairs. */
export function mapComponentToFormFields(
  entry: ComponentCatalogEntry,
  version?: string
): Record<string, string> {
  const fields: Record<string, string> = { ...entry.defaultFields };
  if (version) {
    fields['version'] = version;
    fields['betriebssystemversion'] = version;
    fields['datenbankversion'] = version;
  }
  return fields;
}

/**
 * Non-destructive autofill: only writes to empty/undefined form values.
 * Returns merged form state + a list of fields that were filled.
 */
export function autofillFormFields(
  currentValues: Record<string, unknown>,
  newFields: Record<string, string>
): { merged: Record<string, unknown>; filled: string[] } {
  const merged = { ...currentValues };
  const filled: string[] = [];
  for (const [key, val] of Object.entries(newFields)) {
    const cur = currentValues[key];
    if (cur === undefined || cur === null || cur === '') {
      merged[key] = val;
      filled.push(key);
    }
  }
  return { merged, filled };
}

/**
 * Tries to match free-text to a catalog entry.
 * Returns best match or undefined.
 */
export function matchComponentFromText(text: string): ComponentCatalogEntry | undefined {
  if (!text) return undefined;
  const t = normalizeText(text);
  const catalog = effectiveCatalog();
  // Exact product name match first
  let best = catalog.find(e => normalizeText(e.product) === t);
  if (best) return best;
  // Alias match
  best = catalog.find(e =>
    (e.aliases ?? []).some(a => normalizeText(a) === t)
  );
  if (best) return best;
  // Substring: product name is contained in text or vice versa (min 4 chars)
  best = catalog.find(e => {
    const p = normalizeText(e.product);
    return p.length >= 4 && (t.includes(p) || p.includes(t));
  });
  return best;
}
