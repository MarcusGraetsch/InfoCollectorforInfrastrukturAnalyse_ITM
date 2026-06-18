import type { AppState } from './types';

export const STORAGE_KEY = 'it-strukturanalyse-data';

export const defaultState: AppState = {
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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  const updated = { ...state, lastUpdated: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Löscht alle App-Daten aus dem localStorage und schreibt sofort den
 * leeren defaultState zurück. Das verhindert, dass noch in-flight liegende
 * React-updateState-Callbacks den alten State nach dem Clear neu schreiben.
 */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Leeren Zustand sofort persistieren — überschreibt jeden Nachzügler
  saveState(defaultState);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function generateKuerzel(prefix: string, existing: { kuerzel: string }[]): string {
  const nums = existing
    .map((e) => {
      const match = e.kuerzel.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
