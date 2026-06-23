import type { AppState, CategoryKey } from '../types';

/**
 * Laufzeit-Objekte, die auf einer Plattform laufen. NICHT `server` —
 * ein Server IST die Plattform.
 */
export const RUNTIME_CATEGORIES: CategoryKey[] = ['anwendungen', 'betriebssysteme', 'clients', 'icsSysteme', 'iotSysteme'];

export const PLATTFORM_TYP_OPTIONS = [
  '',
  'Physische Hardware',
  'Virtuelle Maschine',
  'Container',
  'Cloud-Dienst / SaaS',
  'Externes System (Dienstleister)',
  'Unklar — beim Kunden erfragen',
] as const;

/** Relation (multiref) fields that express "runs on" per runtime category. */
export const PLATTFORM_RELATION_FIELDS: Record<string, string[]> = {
  anwendungen:     ['itSysteme', 'betriebssysteme'],
  betriebssysteme: ['itSysteme'],
  clients:         ['betriebssysteme'],
  icsSysteme:      ['itSysteme'],
  iotSysteme:      ['itSysteme'],
};

const UNKLAR = 'Unklar — beim Kunden erfragen';

/** A runtime item has an unresolved platform if no relation link is set AND plattformTyp is empty or 'Unklar'. */
export function isPlatformUnassigned(item: Record<string, unknown>, category: string): boolean {
  const rels = PLATTFORM_RELATION_FIELDS[category] ?? [];
  const hasLink = rels.some(f => Array.isArray(item[f]) && (item[f] as unknown[]).length > 0);
  const typ = (item['plattformTyp'] as string) ?? '';
  if (hasLink) return false;                 // linked → resolved
  if (typ && typ !== UNKLAR) return false;   // a concrete platform type was chosen (e.g. external system) → resolved
  return true;                               // empty or explicitly Unklar → open point
}

export interface PlatformGap { category: CategoryKey; id: string; kuerzel: string; name: string; explicitUnklar: boolean; }

export function findPlatformGaps(state: AppState): PlatformGap[] {
  const gaps: PlatformGap[] = [];
  for (const cat of RUNTIME_CATEGORIES) {
    const items = (state[cat] as unknown as Record<string, unknown>[]) ?? [];
    for (const item of items) {
      if (isPlatformUnassigned(item, cat)) {
        gaps.push({
          category: cat,
          id: item['id'] as string,
          kuerzel: (item['kuerzel'] as string) ?? '',
          name: (item['name'] as string) ?? '',
          explicitUnklar: (item['plattformTyp'] as string) === UNKLAR,
        });
      }
    }
  }
  return gaps;
}
