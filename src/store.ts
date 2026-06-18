import type { AppState } from './types';

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
    quelldokumente: [],
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

  // Jede Kategorie/Array-Property als Array erzwingen
  const arrayKeys: (keyof AppState)[] = [
    'quelldokumente', 'geschaeftsprozesse', 'daten', 'anwendungen', 'datentraeger',
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
