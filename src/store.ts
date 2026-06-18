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
    const raw = localStorage.getItem(getDataKey());
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

export function saveState(state: AppState): void {
  const updated = { ...state, lastUpdated: new Date().toISOString() };
  localStorage.setItem(getDataKey(), JSON.stringify(updated));
}

/**
 * Löscht alle App-Daten und die Installations-ID.
 * Beim nächsten App-Start wird eine neue ID generiert → neuer Storage-Key
 * → komplett leerer Zustand, unabhängig davon was noch im Browser liegt.
 */
export function clearState(): void {
  const key = getDataKey();
  localStorage.removeItem(INSTALL_ID_KEY);
  localStorage.removeItem(key);
  // Keine saveState(defaultState) mehr nötig — fehlende ID = sauberer Start
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
