import type { AppData } from './types';

const STORAGE_KEY = 'it-strukturanalyse-data';

export const defaultData: AppData = {
  kundenname: '',
  letzteAktualisierung: new Date().toISOString().split('T')[0],
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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateKuerzel(prefix: string, existing: { kuerzel: string }[]): string {
  const nums = existing
    .map(e => {
      const match = e.kuerzel.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
