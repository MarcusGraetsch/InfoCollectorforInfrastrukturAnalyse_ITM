// Block 11 — Snapshot-Versionierung & Delta
import type { Snapshot, AppState } from './types';

const SNAPSHOT_KEY = 'it-sa-snapshots';
const MAX_SNAPSHOTS = 20;

export function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

export function saveSnapshot(state: AppState, label: string): Snapshot {
  const snapshots = loadSnapshots();
  const newSnap: Snapshot = {
    id: `snap-${Date.now()}`,
    label,
    createdAt: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state)) as AppState,
  };
  const updated = [newSnap, ...snapshots].slice(0, MAX_SNAPSHOTS);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
  return newSnap;
}

export function deleteSnapshot(id: string): void {
  const snapshots = loadSnapshots().filter((s) => s.id !== id);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

// ---- Delta Computation ----

export type DeltaStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DeltaItem {
  category: string;
  id: string;
  name: string;
  status: DeltaStatus;
  changedFields?: string[];
}

export interface DeltaResult {
  snapshotA: string;
  snapshotB: string;
  items: DeltaItem[];
  summary: { added: number; removed: number; changed: number; unchanged: number };
}

type WithId = { id?: string; name?: string; bezeichnung?: string; hostname?: string };

function extractItems(state: AppState): { category: string; id: string; name: string; raw: unknown }[] {
  const categories: (keyof AppState)[] = [
    'anwendungen', 'server', 'clients', 'icsSysteme', 'iotSysteme',
    'netzkomponenten', 'netzverbindungen', 'datentraeger', 'raeume', 'gebaeude',
    'geschaeftsprozesse', 'daten', 'stakeholder', 'meetings', 'liefergegenstaende',
    'quelldokumente', 'iktDienstleister',
  ];
  const result: { category: string; id: string; name: string; raw: unknown }[] = [];
  for (const cat of categories) {
    const items = state[cat];
    if (!Array.isArray(items)) continue;
    for (const item of items as WithId[]) {
      const id = item.id ?? '';
      const name = item.name ?? item.bezeichnung ?? item.hostname ?? id;
      result.push({ category: cat, id, name, raw: item });
    }
  }
  return result;
}

export function computeDelta(snapA: Snapshot, snapB: Snapshot): DeltaResult {
  const itemsA = extractItems(snapA.state);
  const itemsB = extractItems(snapB.state);

  const mapA = new Map(itemsA.map((i) => [`${i.category}::${i.id}`, i]));
  const mapB = new Map(itemsB.map((i) => [`${i.category}::${i.id}`, i]));

  const deltaItems: DeltaItem[] = [];

  for (const [key, a] of mapA) {
    const b = mapB.get(key);
    if (!b) {
      deltaItems.push({ category: a.category, id: a.id, name: a.name, status: 'removed' });
    } else {
      const aStr = JSON.stringify(a.raw);
      const bStr = JSON.stringify(b.raw);
      if (aStr !== bStr) {
        // Find changed fields
        const aObj = a.raw as Record<string, unknown>;
        const bObj = b.raw as Record<string, unknown>;
        const changedFields = Object.keys({ ...aObj, ...bObj }).filter(
          (k) => JSON.stringify(aObj[k]) !== JSON.stringify(bObj[k])
        );
        deltaItems.push({ category: a.category, id: a.id, name: a.name, status: 'changed', changedFields });
      } else {
        deltaItems.push({ category: a.category, id: a.id, name: a.name, status: 'unchanged' });
      }
    }
  }

  for (const [key, b] of mapB) {
    if (!mapA.has(key)) {
      deltaItems.push({ category: b.category, id: b.id, name: b.name, status: 'added' });
    }
  }

  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const d of deltaItems) summary[d.status]++;

  return {
    snapshotA: snapA.label,
    snapshotB: snapB.label,
    items: deltaItems.filter((d) => d.status !== 'unchanged'),
    summary,
  };
}
