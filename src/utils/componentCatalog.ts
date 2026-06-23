import type { ComponentCatalogEntry, ComponentKind } from '../data/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[\s\-_.]+/g, ' ').trim();
}

export function searchComponents(query: string, kind?: ComponentKind, limit = 20): ComponentCatalogEntry[] {
  if (!query || query.length < 2) return [];
  const q = normalizeText(query);
  return COMPONENT_CATALOG.filter(e => {
    if (kind && e.kind !== kind) return false;
    const haystack = normalizeText([e.vendor, e.product, ...(e.aliases ?? []), ...(e.tags ?? [])].join(' '));
    return haystack.includes(q);
  }).slice(0, limit);
}

export function getComponentById(id: string): ComponentCatalogEntry | undefined {
  return COMPONENT_CATALOG.find(e => e.id === id);
}

export function getComponentSuggestionsForCategory(categoryKey: string, limit = 8): ComponentCatalogEntry[] {
  return COMPONENT_CATALOG.filter(e => e.categoryTargets.includes(categoryKey)).slice(0, limit);
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
  // Exact product name match first
  let best = COMPONENT_CATALOG.find(e => normalizeText(e.product) === t);
  if (best) return best;
  // Alias match
  best = COMPONENT_CATALOG.find(e =>
    (e.aliases ?? []).some(a => normalizeText(a) === t)
  );
  if (best) return best;
  // Substring: product name is contained in text or vice versa (min 4 chars)
  best = COMPONENT_CATALOG.find(e => {
    const p = normalizeText(e.product);
    return p.length >= 4 && (t.includes(p) || p.includes(t));
  });
  return best;
}
