import type { AppState, CategoryKey, CloudFields } from './types';
import { ASSESSABLE_CATEGORIES } from './cloudReadiness';

/**
 * SINGLE SOURCE OF TRUTH für alle cloud-relevanten Felder.
 *
 * Vorher waren Keys, Labels, Options und Fragen über CategoryList, AppHeader,
 * CloudReadinessWizard und OffenePunkte 4-fach dupliziert — mit der Gefahr,
 * dass z.B. der Header-Badge eine andere Zahl zeigt als die Liste. Alles, was
 * mit den 7 offenen Cloud-Feldern zu tun hat, wird ab jetzt von hier importiert.
 */

export type CloudFieldKey =
  | 'schutzbedarf'
  | 'bereitstellung'
  | 'lizenzCloudfaehig'
  | 'migrationskomplexitaet'
  | 'lebenszyklus'
  | 'internetfaehig'
  | 'datensouveraenitaet';

export type CloudTheme =
  | 'Betrieb & Bereitstellung'
  | 'Lizenz & Kosten'
  | 'Lebenszyklus & Technik'
  | 'Sicherheit & Compliance';

export interface CloudFieldDef {
  key: CloudFieldKey;
  /** Label im Plural/Tabellenkontext */
  label: string;
  theme: CloudTheme;
  options: string[];
  question: (name: string) => string;
  /** Wenn gesetzt: Feld nur für diese Kategorien relevant (z.B. Lizenz nur Anwendungen) */
  onlyCategories?: CategoryKey[];
}

export const CLOUD_FIELD_DEFS: CloudFieldDef[] = [
  {
    key: 'schutzbedarf',
    label: 'Schutzbedarf',
    theme: 'Sicherheit & Compliance',
    options: ['Normal', 'Hoch', 'Sehr hoch', 'Unklar'],
    question: (n) => `Wie hoch ist der Schutzbedarf von „${n}"? (Normal / Hoch / Sehr hoch) — Relevant für Vertraulichkeit, Integrität und Verfügbarkeit.`,
  },
  {
    key: 'bereitstellung',
    label: 'Bereitstellung',
    theme: 'Betrieb & Bereitstellung',
    options: [
      'On-Premises (physisch)',
      'On-Premises (virtualisiert)',
      'Hybrid',
      'Private Cloud',
      'SaaS / Public Cloud',
      'Container (Docker/Podman)',
      'Kubernetes (On-Prem)',
      'Managed Kubernetes (Cloud)',
      'Unklar',
    ],
    question: (n) => `Wo läuft „${n}" aktuell? On-Premises (physisch/virtualisiert), Hybrid, Private Cloud oder bereits SaaS/Public Cloud?`,
  },
  {
    key: 'lizenzCloudfaehig',
    label: 'Lizenz cloudfähig',
    theme: 'Lizenz & Kosten',
    options: ['Ja', 'Nein', 'Unklar'],
    onlyCategories: ['anwendungen'],
    question: (n) => `Erlaubt die Lizenz von „${n}" einen Cloud- oder Hosting-Betrieb? Gibt es Cloud-Klauseln, Named-Host- oder On-Premises-Bindungen im Lizenzvertrag?`,
  },
  {
    key: 'migrationskomplexitaet',
    label: 'Migrationskomplexität',
    theme: 'Betrieb & Bereitstellung',
    options: ['Niedrig', 'Mittel', 'Hoch', 'Unklar'],
    question: (n) => `Wie komplex wäre eine Migration von „${n}"? Gibt es spezifische Abhängigkeiten, Hardware-Bindungen, proprietäre Schnittstellen oder umfangreiches Customizing?`,
  },
  {
    key: 'lebenszyklus',
    label: 'Lebenszyklus-Status',
    theme: 'Lebenszyklus & Technik',
    options: ['Aktuell', 'Wartung läuft aus', 'End-of-Life', 'Unklar'],
    question: (n) => `Wie ist der Wartungs- und Supportstatus von „${n}"? Wann läuft der Herstellersupport aus? Gibt es einen geplanten Ablöse- oder Migrationstermin?`,
  },
  {
    key: 'internetfaehig',
    label: 'Internet-/Cloudfähigkeit',
    theme: 'Betrieb & Bereitstellung',
    options: ['Ja', 'Nein', 'Eingeschränkt', 'Unklar'],
    question: (n) => `Kann „${n}" über das Internet oder aus der Cloud heraus betrieben werden? Gibt es Latenzanforderungen, lokale Hardwareabhängigkeiten oder spezielle Netzwerkanforderungen?`,
  },
  {
    key: 'datensouveraenitaet',
    label: 'Datensouveränität',
    theme: 'Sicherheit & Compliance',
    options: [
      'Keine spezielle Anforderung',
      'EU / DSGVO',
      'Deutschland',
      'Streng souverän (C5 / Gaia-X)',
      'Confidential Computing (TEE / Enclave)',
      'Unklar',
    ],
    question: (n) => `Welche regulatorischen Anforderungen gelten für die Daten von „${n}"? Gibt es Vorgaben zu DSGVO, Datenspeicherort (Deutschland/EU) oder Zertifizierungen wie BSI C5 / Gaia-X?`,
  },
];

/** Migrationsstrategie (6R) — kein „offenes Pflichtfeld", aber zentrale Optionsliste. */
export const CLOUD_EIGNUNG_OPTIONS = [
  'Rehost (Lift & Shift)',
  'Replatform (leichte Anpassung)',
  'Recontainerize (→ Kubernetes)',
  'Repurchase (SaaS-Alternative)',
  'Refactor / Re-Architect',
  'Retain (Behalten)',
  'Retire (Abschalten)',
];

export const OPEN_CLOUD_KEYS: CloudFieldKey[] = CLOUD_FIELD_DEFS.map((f) => f.key);

export const CLOUD_FIELD_LABELS = Object.fromEntries(
  CLOUD_FIELD_DEFS.map((f) => [f.key, f.label])
) as Record<CloudFieldKey, string>;

export const CLOUD_FIELD_OPTIONS = Object.fromEntries(
  CLOUD_FIELD_DEFS.map((f) => [f.key, f.options])
) as Record<CloudFieldKey, string[]>;

export const CLOUD_FIELD_BY_KEY = Object.fromEntries(
  CLOUD_FIELD_DEFS.map((f) => [f.key, f])
) as Record<CloudFieldKey, CloudFieldDef>;

export const CLOUD_THEMES: CloudTheme[] = [
  'Betrieb & Bereitstellung',
  'Lizenz & Kosten',
  'Lebenszyklus & Technik',
  'Sicherheit & Compliance',
];

export const CLOUD_THEME_ICONS: Record<CloudTheme, string> = {
  'Betrieb & Bereitstellung': '🖥',
  'Lizenz & Kosten': '📄',
  'Lebenszyklus & Technik': '🔄',
  'Sicherheit & Compliance': '🔒',
};

/** Leer oder „Unklar" = offener Punkt. */
export function isOpenField(val: unknown): boolean {
  return !val || val === '' || val === 'Unklar';
}

/** Ist dieses Feld für die gegebene Kategorie überhaupt relevant? */
export function isFieldRelevant(def: CloudFieldDef, category: CategoryKey): boolean {
  return !def.onlyCategories || def.onlyCategories.includes(category);
}

/** Liefert die offenen (leer/Unklar) Cloud-Feld-Definitionen eines Items. */
export function getOpenCloudFieldDefs(
  item: Record<string, unknown>,
  category?: CategoryKey
): CloudFieldDef[] {
  return CLOUD_FIELD_DEFS.filter((def) => {
    if (category && !isFieldRelevant(def, category)) return false;
    return isOpenField(item[def.key]);
  });
}

/** Hat ein Item mindestens ein offenes Cloud-Feld? */
export function hasOpenCloudFields(item: Record<string, unknown>, category?: CategoryKey): boolean {
  return getOpenCloudFieldDefs(item, category).length > 0;
}

/**
 * Zählt alle Objekte über alle bewertbaren Kategorien, die noch mindestens ein
 * offenes Cloud-Feld haben. EINE Definition für Header-Badge UND OffenePunkte.
 */
export function countItemsWithOpenFields(state: AppState): number {
  let count = 0;
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = state[cat] as unknown as (CloudFields & { id: string })[];
    for (const item of items) {
      if (hasOpenCloudFields(item as unknown as Record<string, unknown>, cat)) count++;
    }
  }
  return count;
}
