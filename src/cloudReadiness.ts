import type { AppState, CategoryKey, CloudFields } from './types';

export type ReadinessLevel = 'Hoch' | 'Mittel' | 'Niedrig' | 'Unbewertet';

export interface ReadinessResult {
  score: number; // 0-100
  level: ReadinessLevel;
  /** Automatisch vorgeschlagene 6R-Strategie */
  empfehlung: string;
  /** Souveräne Cloud erforderlich? */
  souveraen: boolean;
  begruendung: string[];
}

/** Kategorien, für die ein Cloud-Readiness-Assessment sinnvoll ist. */
export const ASSESSABLE_CATEGORIES: CategoryKey[] = [
  'anwendungen',
  'server',
  'clients',
  'icsSysteme',
  'iotSysteme',
];

export interface AssessedItem extends CloudFields {
  id: string;
  kuerzel: string;
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  result: ReadinessResult;
}

const CATEGORY_LABEL: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  icsSysteme: 'ICS-System',
  iotSysteme: 'IoT-System',
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Heuristisches Scoring der Cloud-Eignung eines Objekts.
 * Ausgerichtet auf souveräne/BSI-konforme UND provider-neutrale Cloud.
 */
export function assess(item: CloudFields, category: CategoryKey): ReadinessResult {
  const filled =
    item.bereitstellung ||
    item.schutzbedarf ||
    item.lizenzCloudfaehig ||
    item.migrationskomplexitaet ||
    item.lebenszyklus ||
    item.internetfaehig ||
    item.datensouveraenitaet;

  if (!filled) {
    return {
      score: 0,
      level: 'Unbewertet',
      empfehlung: 'Noch nicht bewertet',
      souveraen: false,
      begruendung: ['Keine Cloud-Angaben erfasst – im Assistenten ergänzen.'],
    };
  }

  let score = 50;
  const b: string[] = [];

  switch (item.bereitstellung) {
    case 'SaaS / Public Cloud':
      score += 30;
      b.push('Wird bereits als SaaS/Public Cloud betrieben.');
      break;
    case 'Private Cloud':
      score += 20;
      b.push('Bereits in einer Private Cloud – gute Ausgangslage.');
      break;
    case 'Hybrid':
      score += 15;
      break;
    case 'On-Premises (virtualisiert)':
      score += 10;
      b.push('Virtualisiert – Lift & Shift gut möglich.');
      break;
    case 'On-Premises (physisch)':
      score -= 10;
      b.push('Physischer Betrieb – Migration aufwändiger.');
      break;
  }

  switch (item.lizenzCloudfaehig) {
    case 'Ja':
      score += 15;
      break;
    case 'Nein':
      score -= 20;
      b.push('Lizenz nicht cloudfähig – ggf. SaaS-Alternative (Repurchase).');
      break;
    case 'Unklar':
      score -= 5;
      b.push('Lizenz-Cloudfähigkeit klären.');
      break;
  }

  switch (item.migrationskomplexitaet) {
    case 'Niedrig':
      score += 15;
      break;
    case 'Hoch':
      score -= 15;
      b.push('Hohe Migrationskomplexität (Abhängigkeiten/Customizing).');
      break;
  }

  switch (item.lebenszyklus) {
    case 'Aktuell':
      score += 5;
      break;
    case 'Wartung läuft aus':
      score -= 5;
      break;
    case 'End-of-Life':
      score -= 15;
      b.push('End-of-Life – Ablösung (Retire) oder Neubeschaffung prüfen.');
      break;
  }

  if (item.schutzbedarf === 'Sehr hoch') {
    score -= 10;
    b.push('Sehr hoher Schutzbedarf – erhöhte Anforderungen an den Anbieter.');
  } else if (item.schutzbedarf === 'Hoch') {
    score -= 5;
  }

  if (item.internetfaehig === 'Nein') {
    score -= 10;
    b.push('Nicht internet-/cloud-fähig (lokale Latenz/Hardware nötig).');
  }

  // OT-Systeme sind selten migrierbar
  const isOT = category === 'icsSysteme' || category === 'iotSysteme';
  if (isOT) {
    score -= 15;
    b.push('OT-/Spezialsystem – Cloud-Migration meist nicht empfohlen.');
  }

  score = clamp(score);

  const souveraen =
    item.datensouveraenitaet === 'Deutschland' ||
    item.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' ||
    (item.schutzbedarf === 'Sehr hoch' &&
      item.datensouveraenitaet !== 'Keine spezielle Anforderung' &&
      !!item.datensouveraenitaet);

  if (souveraen) {
    b.push(
      'Souveränitätsanforderung: souveräne Cloud (C5-Testat / Gaia-X / DE-Standort) erforderlich.'
    );
  }

  // 6R-Empfehlung
  let empfehlung: string;
  if (item.bereitstellung === 'SaaS / Public Cloud' || item.bereitstellung === 'Private Cloud') {
    empfehlung = 'Retain (bereits Cloud)';
  } else if (item.lebenszyklus === 'End-of-Life') {
    empfehlung = 'Retire / Repurchase (SaaS)';
  } else if (isOT || item.internetfaehig === 'Nein') {
    empfehlung = 'Retain (Behalten)';
  } else if (item.lizenzCloudfaehig === 'Nein') {
    empfehlung = 'Repurchase (SaaS)';
  } else if (score >= 70) {
    empfehlung = 'Rehost / Replatform';
  } else if (score >= 45) {
    empfehlung = 'Replatform / Refactor';
  } else {
    empfehlung = 'Retain (vorerst)';
  }

  const level: ReadinessLevel = score >= 70 ? 'Hoch' : score >= 45 ? 'Mittel' : 'Niedrig';

  if (b.length === 0) b.push('Solide Ausgangslage für eine Migration.');

  return { score, level, empfehlung, souveraen, begruendung: b };
}

/** Bewertet alle cloud-relevanten Objekte des gesamten Zustands. */
export function assessAll(state: AppState): AssessedItem[] {
  const out: AssessedItem[] = [];
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = state[cat] as unknown as (CloudFields & {
      id: string;
      kuerzel: string;
      name: string;
    })[];
    for (const item of items) {
      out.push({
        ...item,
        category: cat,
        categoryLabel: CATEGORY_LABEL[cat] ?? cat,
        result: assess(item, cat),
      });
    }
  }
  return out;
}

export interface PortfolioSummary {
  total: number;
  bewertet: number;
  unbewertet: number;
  avgScore: number;
  hoch: number;
  mittel: number;
  niedrig: number;
  souveraen: number;
  dispositionCounts: Record<string, number>;
}

export function summarize(items: AssessedItem[]): PortfolioSummary {
  const bewerteteItems = items.filter((i) => i.result.level !== 'Unbewertet');
  const dispositionCounts: Record<string, number> = {};
  let sum = 0;
  let hoch = 0;
  let mittel = 0;
  let niedrig = 0;
  let souveraen = 0;
  for (const i of bewerteteItems) {
    sum += i.result.score;
    if (i.result.level === 'Hoch') hoch++;
    else if (i.result.level === 'Mittel') mittel++;
    else niedrig++;
    if (i.result.souveraen) souveraen++;
    const d = i.result.empfehlung;
    dispositionCounts[d] = (dispositionCounts[d] ?? 0) + 1;
  }
  return {
    total: items.length,
    bewertet: bewerteteItems.length,
    unbewertet: items.length - bewerteteItems.length,
    avgScore: bewerteteItems.length ? Math.round(sum / bewerteteItems.length) : 0,
    hoch,
    mittel,
    niedrig,
    souveraen,
    dispositionCounts,
  };
}
