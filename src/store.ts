import type { AppState, Liefergegenstand, Stakeholder, TCODaten } from './types';
import { clearAIConfig } from './integrations/aiSuggest';

const DEFAULT_TCO: TCODaten = {
  zeithorizont: '5',
  istkostenOnPrem: { hardware: '', lizenzen: '', personalBetrieb: '', wartung: '', raumEnergie: '', sonstiges: '' },
  zielkostenCloud: { cloudInfrastruktur: '', lizenzenSaaS: '', personalCloud: '', migration: '', sonstiges: '' },
  notizen: '',
};


export const DEFAULT_STAKEHOLDER: Stakeholder[] = [
  { id: 'sh-1',  name: '', rolle: 'Geschäftsführung',         bereich: 'Geschäftsführung',              email: '', telefon: '', lgIds: [1, 7, 14, 17, 19], notizen: 'Entscheidungs- und Eskalationsinstanz, Integration in Workshops' },
  { id: 'sh-2',  name: '', rolle: 'Teamleitung Digitalisierung', bereich: 'Digitalisierung',             email: '', telefon: '', lgIds: [1, 8, 12, 16, 18, 19], notizen: 'Interne Projektleitung und Abstimmungsinstanz' },
  { id: 'sh-3',  name: '', rolle: 'IT-Leitung',                bereich: 'IT-Abteilung',                 email: '', telefon: '', lgIds: [2, 3, 4, 5, 9, 10, 15, 17, 18], notizen: 'Technische Architektur, Betrieb, Lizenzmanagement' },
  { id: 'sh-4',  name: '', rolle: 'IT-Mitarbeiter',            bereich: 'IT-Abteilung',                 email: '', telefon: '', lgIds: [2, 3, 4, 10], notizen: 'Technische Umsetzung, Systembetrieb' },
  { id: 'sh-5',  name: '', rolle: 'Controlling / Buchhaltung', bereich: 'Controlling',                  email: '', telefon: '', lgIds: [6, 7], notizen: 'Kostenstrukturen, Business Case, Validierung von Kostendaten' },
  { id: 'sh-6',  name: '', rolle: 'SAM / Lizenzmanagement',    bereich: 'Einkauf / IT',                 email: '', telefon: '', lgIds: [5, 6], notizen: 'Analyse bestehender Verträge und Lizenzmodelle' },
  { id: 'sh-7',  name: '', rolle: 'Datenschutzbeauftragte:r',  bereich: 'Datenschutz',                  email: '', telefon: '', lgIds: [9, 10, 11], notizen: 'Compliance und rechtliche Bewertung' },
  { id: 'sh-8',  name: '', rolle: 'Informationssicherheitsbeauftragte:r', bereich: 'IT-Sicherheit',     email: '', telefon: '', lgIds: [9, 10], notizen: 'Security Controls, IAM, regulatorische Implikationen' },
  { id: 'sh-9',  name: '', rolle: 'Fachbereiche',              bereich: 'Fachabteilungen',              email: '', telefon: '', lgIds: [8, 12, 16], notizen: 'Spezifische Anforderungen an Anwendungen und Workflows' },
  { id: 'sh-10', name: '', rolle: 'HR / Betriebsrat',          bereich: 'HR',                           email: '', telefon: '', lgIds: [16], notizen: 'Change-Begleitung, ggf. Betriebsrat einbinden' },
];

export const DEFAULT_LIEFERGEGENSTAENDE: Liefergegenstand[] = [
  { id: 1,  phase: 'Projekt-Kick-off',                              titel: 'Projekt-Kick-off-Workshop inkl. Dokumentation',           beschreibung: 'Kick-off-Ergebnisse, Ziele, Scope, Meilensteinplanung',                                                             aufwandAuftraggeber: '1 PT pro Teilnehmer, 1 PT PL zur Vorbereitung', status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 2,  phase: 'Analyse technische Infrastruktur',              titel: 'Bericht und tabellarische Auflistung der aktuellen Infrastruktur', beschreibung: 'Strategische Bewertung Cloud-Eignung',                                                                         aufwandAuftraggeber: '1 PT pro IT-Mitarbeiter',                        status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 3,  phase: 'Analyse technische Infrastruktur',              titel: 'Infrastruktur-Landkarte',                                 beschreibung: 'Übersicht aller Systeme in einem Schaubild',                                                                          aufwandAuftraggeber: '0,5 PT pro IT-Mitarbeiter',                      status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 4,  phase: 'Cloud-Readiness-Analyse',                       titel: 'Cloud-Readiness-Workshop, Ergebnisdokumentation',         beschreibung: 'Cloud-Readiness-Assessment-Dokumentation',                                                                           aufwandAuftraggeber: '1,5 PT pro Workshop-TN',                         status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 5,  phase: 'Cloud-Readiness-Analyse',                       titel: 'Lizenz- und Kostenanalyse',                               beschreibung: 'Analyse bestehender Lizenzmodelle, Vertragsstrukturen und Betriebskosten inkl. Cloud-Tauglichkeit und Risiken',       aufwandAuftraggeber: '2 PT pro benötigter Experte',                    status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 6,  phase: 'Cloud-Readiness-Analyse',                       titel: 'TCO-Modell & Wirtschaftlichkeitsanalyse',                 beschreibung: 'Vergleich von On-Premises, Hybrid und Cloud inkl. qualitativer Faktoren',                                              aufwandAuftraggeber: '1 PT pro Experte zum Review',                    status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 7,  phase: 'Cloud-Strategie',                               titel: 'Business Case Cloud-Transformation',                      beschreibung: 'Entscheidungsgrundlage für Management inkl. Risiken, Kosten, Nutzen',                                                  aufwandAuftraggeber: '1 PT pro Reviewer',                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 8,  phase: 'Cloud-Strategie',                               titel: 'Cloud-Kompatibilität, Geschäftsprozessanalyse, Priorisierungsmatrix & Roadmap', beschreibung: 'Bewertung & Ranking Anwendungen und Geschäftsprozesse',                                               aufwandAuftraggeber: '1 PT pro Reviewer',                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 9,  phase: 'Cloud-Strategie',                               titel: 'Vorschlag Security- und Governance-Architektur',          beschreibung: 'Definition der sicherheitsrelevanten und organisatorischen Architekturprinzipien für den Cloud-Betrieb (IAM, Mandantentrennung, Netzwerksegmentierung)', aufwandAuftraggeber: '1 PT pro Workshop-TN',            status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 10, phase: 'Cloud-Strategie',                               titel: 'Zielarchitektur Betriebs-, Backup- und Recovery-Konzept', beschreibung: 'Anforderungen und Leitlinien für den stabilen und sicheren Betrieb von Cloud-Anwendungen',                              aufwandAuftraggeber: '1,5 PT pro Workshop-TN',                         status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 11, phase: 'Cloud-Strategie',                               titel: 'Exit- & Portabilitätskonzept',                            beschreibung: 'Strategien zur Vermeidung von Lock-in und Sicherstellung von Anbieterwechseln',                                        aufwandAuftraggeber: '0,5 PT pro Reviewer',                            status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 12, phase: 'Cloud-Strategie',                               titel: 'Strategie-Workshop, Ergebnisdokumentation',               beschreibung: 'Gemeinsame Entwicklung von Struktur, Zielbild und Detaillierungsgrad',                                                  aufwandAuftraggeber: '2 PT pro Workshop-TN',                           status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 13, phase: 'Cloud-Strategie',                               titel: 'Transformations- und Implementierungsplanung, Roadmap',   beschreibung: 'Priorisierte Maßnahmen inkl. zeitlicher Planung',                                                                     aufwandAuftraggeber: '0,5 PT pro Reviewer',                            status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 14, phase: 'Cloud-Strategie',                               titel: 'Executive Summary',                                       beschreibung: 'Managementgerechte Kurzfassung zur Entscheidungsfindung',                                                              aufwandAuftraggeber: '0,5 PT pro Reviewer',                            status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 15, phase: 'Cloud-Strategie',                               titel: 'Technische Langfassung',                                  beschreibung: 'Vollständige Strategie inkl. Architektur, Governance, Anhängen',                                                        aufwandAuftraggeber: '2 PT pro Reviewer',                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 16, phase: 'Projektgovernance & Change-Begleitung',         titel: 'Change-Strategie & Roadmap, Stakeholder- & Impact-Analyse', beschreibung: 'Strukturierter Ansatz für organisatorische Transformation, Analyse von Betroffenen, Widerständen und Potenzialen',  aufwandAuftraggeber: '1 PT pro Reviewer',                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 17, phase: 'Projektgovernance & Change-Begleitung',         titel: 'Lenkungsausschuss-Meetings, Protokolle',                  beschreibung: 'Lenkungsausschuss-Meetings mit Geschäftsführung (1× monatlich, 1h, IT-Leitung + GF)',                                    aufwandAuftraggeber: '–',                                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 18, phase: 'Projektgovernance & Change-Begleitung',         titel: 'Jour-Fixe-Meetings, Protokolle',                          beschreibung: 'Wöchentliche Meetings zum aktuellen Projektstatus (1h, 2 Personen, IT)',                                               aufwandAuftraggeber: '–',                                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
  { id: 19, phase: 'Projektgovernance & Change-Begleitung',         titel: 'Abschlussbericht',                                        beschreibung: 'Abschlussabstimmung mit Management und Schlüsselrollen',                                                              aufwandAuftraggeber: '–',                                              status: 'Offen', faelligAm: '', notizen: '', anhaenge: [] },
];

const INSTALL_ID_KEY = 'it-strukturanalyse-install-id';
const OLD_DATA_KEY   = 'it-strukturanalyse-data'; // legacy key (pre-v2)

function getDataKey(): string {
  let id = localStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(INSTALL_ID_KEY, id);
    // One-time migration: carry over data from the old fixed key
    const legacy = localStorage.getItem(OLD_DATA_KEY);
    if (legacy) {
      localStorage.setItem(`it-strukturanalyse-data-${id}`, legacy);
      localStorage.removeItem(OLD_DATA_KEY);
    }
  }
  return `it-strukturanalyse-data-${id}`;
}

/**
 * Erzeugt immer ein FRISCHES, tief geklontes Default-Objekt. Wichtig: niemals
 * ein geteiltes Modul-Objekt in den React-State setzen — sonst können
 * versehentliche Mutationen den globalen Default kontaminieren.
 */
export function createDefaultState(): AppState {
  return {
    customerName: '',
    lastUpdated: new Date().toISOString(),
    cloudStrategy: {
      ziel: '',
      treiber: [],
      zielumgebung: [],
      zeithorizont: '',
      notizen: '',
    },
    nis2Assessment: {
      sektor: '', mitarbeiter: '', umsatzMio: '', kritis: 'Unklar',
      einstufung: 'Unklar', massnahmen: {}, notizen: '', erstelltAm: '',
    },
    quelldokumente: [],
    tcoData: { ...DEFAULT_TCO, istkostenOnPrem: { ...DEFAULT_TCO.istkostenOnPrem }, zielkostenCloud: { ...DEFAULT_TCO.zielkostenCloud } },
    liefergegenstaende: DEFAULT_LIEFERGEGENSTAENDE.map(lg => ({ ...lg, anhaenge: [] })),
    stakeholder: DEFAULT_STAKEHOLDER.map(s => ({ ...s })),
    meetings: [],
    geschaeftsprozesse: [],
    daten: [],
    anwendungen: [],
    datentraeger: [],
    server: [],
    netzkomponenten: [],
    netzverbindungen: [],
    clients: [],
    icsSysteme: [],
    iotSysteme: [],
    raeume: [],
    gebaeude: [],
  };
}

/** @deprecated Nutze createDefaultState() — defaultState bleibt für Kompatibilität. */
export const defaultState: AppState = createDefaultState();

/**
 * Führt geladene/importierte Daten tief mit dem Default zusammen, sodass
 * fehlende oder partielle verschachtelte Strukturen (z.B. altes Backup ohne
 * cloudStrategy.treiber oder ohne quelldokumente-Array) keine undefined-Werte
 * hinterlassen, die später .map()/.some() zum Absturz bringen.
 */
export function mergeWithDefault(partial: Partial<AppState> | null | undefined): AppState {
  const base = createDefaultState();
  if (!partial || typeof partial !== 'object') return base;

  const merged: AppState = { ...base, ...partial };

  // cloudStrategy tief mergen
  merged.cloudStrategy = {
    ...base.cloudStrategy,
    ...(partial.cloudStrategy ?? {}),
    treiber: Array.isArray(partial.cloudStrategy?.treiber) ? partial.cloudStrategy!.treiber : base.cloudStrategy.treiber,
    zielumgebung: Array.isArray(partial.cloudStrategy?.zielumgebung) ? partial.cloudStrategy!.zielumgebung : base.cloudStrategy.zielumgebung,
  };

  // tcoData: falls im Backup nicht vorhanden
  if (!merged.tcoData || typeof merged.tcoData !== 'object') {
    merged.tcoData = { ...DEFAULT_TCO, istkostenOnPrem: { ...DEFAULT_TCO.istkostenOnPrem }, zielkostenCloud: { ...DEFAULT_TCO.zielkostenCloud } };
  } else {
    merged.tcoData = { ...DEFAULT_TCO, ...merged.tcoData, istkostenOnPrem: { ...DEFAULT_TCO.istkostenOnPrem, ...(merged.tcoData.istkostenOnPrem ?? {}) }, zielkostenCloud: { ...DEFAULT_TCO.zielkostenCloud, ...(merged.tcoData.zielkostenCloud ?? {}) } };
  }

  // liefergegenstaende: falls im Backup nicht vorhanden, mit Defaults befüllen
  if (!Array.isArray(merged.liefergegenstaende) || merged.liefergegenstaende.length === 0) {
    merged.liefergegenstaende = DEFAULT_LIEFERGEGENSTAENDE.map(lg => ({ ...lg, anhaenge: [] }));
  } else {
    // Migration: anhaenge-Feld für ältere Einträge ohne dieses Feld ergänzen
    merged.liefergegenstaende = merged.liefergegenstaende.map(lg => ({
      ...lg, anhaenge: Array.isArray(lg.anhaenge) ? lg.anhaenge : [],
    }));
  }
  if (!Array.isArray(merged.stakeholder) || merged.stakeholder.length === 0) {
    merged.stakeholder = DEFAULT_STAKEHOLDER.map(s => ({ ...s }));
  }
  if (!Array.isArray(merged.meetings)) {
    merged.meetings = [];
  }

  // nis2Assessment: optionales Compliance-Modul (Block 2)
  if (!merged.nis2Assessment || typeof merged.nis2Assessment !== 'object') {
    merged.nis2Assessment = {
      sektor: '', mitarbeiter: '', umsatzMio: '', kritis: 'Unklar',
      einstufung: 'Unklar', massnahmen: {}, notizen: '', erstelltAm: '',
    };
  } else if (!merged.nis2Assessment.massnahmen || typeof merged.nis2Assessment.massnahmen !== 'object') {
    merged.nis2Assessment.massnahmen = {};
  }

  // Block 4 Migration: schutzbedarf-String zu CIASchutzbedarf konvertieren
  // (optional — alte String-Werte bleiben gültig dank Union-Typ)
  // Keine aktive Migration nötig, da der Union-Typ beide Formen akzeptiert.

  // Jede Kategorie/Array-Property als Array erzwingen
  const arrayKeys: (keyof AppState)[] = [
    'quelldokumente', 'liefergegenstaende', 'stakeholder', 'meetings', 'geschaeftsprozesse', 'daten', 'anwendungen', 'datentraeger',
    'server', 'netzkomponenten', 'netzverbindungen', 'clients', 'icsSysteme',
    'iotSysteme', 'raeume', 'gebaeude',
  ];
  for (const key of arrayKeys) {
    if (!Array.isArray(merged[key])) {
      (merged as unknown as Record<string, unknown>)[key] = [];
    }
  }

  return merged;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(getDataKey());
    if (!raw) return createDefaultState();
    return mergeWithDefault(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: AppState): void {
  const updated = { ...state, lastUpdated: new Date().toISOString() };
  try {
    localStorage.setItem(getDataKey(), JSON.stringify(updated));
  } catch (err) {
    // QuotaExceededError o.ä. — Daten bleiben im RAM, aber Nutzer warnen
    console.error('saveState fehlgeschlagen:', err);
    alert(
      'Die Daten konnten nicht im Browser gespeichert werden — der lokale Speicher ist möglicherweise voll.\n\n' +
      'Bitte sichern Sie Ihre Daten über „JSON-Backup" und löschen Sie nicht mehr benötigte Einträge.'
    );
  }
}

/**
 * Löscht ALLE App-Daten aus localStorage — install-ID, alle data-Keys (inkl.
 * Legacy-Key), und consultant-name. Beim nächsten Start neue ID → leerer Zustand.
 */
export function clearState(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('it-strukturanalyse')) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('consultant-name');
  // Clear snapshots, AI config, and other app keys
  localStorage.removeItem('it-sa-snapshots');
  localStorage.removeItem('it-sa-encrypted');
  localStorage.removeItem('it-sa-salt');
  localStorage.removeItem('it-sa-iv');
  localStorage.removeItem('exec-summary-notiz');
  localStorage.removeItem('it-sa-fragen-answered');
  localStorage.removeItem('it-sa-security-status');
  localStorage.removeItem('it-sa-security-details');
  clearAIConfig();
  // Clear IndexedDB attachment store
  try {
    indexedDB.deleteDatabase('it-strukturanalyse-files');
  } catch {
    // Non-fatal — ignore if IndexedDB not available
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback für sehr alte Browser
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/** Escaped Regex-Metazeichen, damit Präfixe mit Sonderzeichen die Regex nicht brechen. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function generateKuerzel(prefix: string, existing: { kuerzel: string }[]): string {
  const re = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`);
  const nums = existing
    .map((e) => {
      const match = e.kuerzel.match(re);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
