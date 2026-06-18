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
