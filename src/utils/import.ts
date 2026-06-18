import * as XLSX from 'xlsx';
import type { AppState, CategoryKey } from '../types';
import { CATEGORIES } from '../categories';
import { generateId } from '../store';

export async function importFromExcel(file: File, currentState: AppState): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const newState = { ...currentState };
        for (const cat of CATEGORIES) {
          const sheetName = wb.SheetNames.find(
            (n) => n.toLowerCase() === cat.label.toLowerCase() || n.toLowerCase().startsWith(cat.label.substring(0, 5).toLowerCase())
          );
          if (!sheetName) continue;
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          const fieldMap: Record<string, string> = {};
          for (const f of cat.fields) { fieldMap[f.label] = f.key; }
          const imported = rows.map((row) => {
            const item: Record<string, unknown> = { id: generateId() };
            for (const [label, key] of Object.entries(fieldMap)) {
              const val = row[label];
              const fieldDef = cat.fields.find((f) => f.key === key);
              if (fieldDef?.type === 'multiref') {
                item[key] = val ? String(val).split(',').map((s) => s.trim()).filter(Boolean) : [];
              } else { item[key] = val ?? ''; }
            }
            return item;
          }).filter((item) => item['kuerzel']);
          const existing = newState[cat.key] as unknown as Record<string, unknown>[];
          const existingMap = new Map(existing.map((e) => [e['kuerzel'], e]));
          for (const imp of imported) {
            existingMap.set(imp['kuerzel'] as string, { ...existingMap.get(imp['kuerzel'] as string), ...imp });
          }
          (newState as Record<string, unknown>)[cat.key as string] = Array.from(existingMap.values());
        }
        resolve(newState);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Parst eine Tabelle (Zeilen aus XLSX oder CSV) in AppState-Einträge
function importRows(
  rows: Record<string, unknown>[],
  categoryKey: CategoryKey,
  currentState: AppState
): Record<string, unknown>[] {
  const cat = CATEGORIES.find(c => c.key === categoryKey);
  if (!cat) return (currentState[categoryKey] as unknown as Record<string, unknown>[]);
  const fieldMap: Record<string, string> = {};
  for (const f of cat.fields) { fieldMap[f.label] = f.key; }
  const imported = rows.map((row) => {
    const item: Record<string, unknown> = { id: generateId() };
    for (const [label, key] of Object.entries(fieldMap)) {
      const val = row[label];
      const fieldDef = cat.fields.find((f) => f.key === key);
      if (fieldDef?.type === 'multiref') {
        item[key] = val ? String(val).split(',').map((s) => s.trim()).filter(Boolean) : [];
      } else { item[key] = val ?? ''; }
    }
    return item;
  }).filter((item) => item['kuerzel'] || item['name']);
  const existing = currentState[categoryKey] as unknown as Record<string, unknown>[];
  const existingMap = new Map(existing.map((e) => [e['kuerzel'] ?? e['id'], e]));
  for (const imp of imported) {
    const k = (imp['kuerzel'] as string) || (imp['id'] as string);
    existingMap.set(k, { ...existingMap.get(k), ...imp });
  }
  return Array.from(existingMap.values());
}

// CSV/TXT: Spaltenköpfe aus erster Zeile, Werte aus folgenden Zeilen
function parseCsvToRows(text: string): Record<string, unknown>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const firstLine = lines[0];
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

export async function importFromExcelWithMapping(
  file: File,
  mapping: Record<string, CategoryKey | null>,
  currentState: AppState
): Promise<AppState> {
  const name = file.name.toLowerCase();
  const newState = { ...currentState };

  // CSV / TXT
  if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) {
    const text = await file.text();
    const rows = parseCsvToRows(text);
    for (const [sheetName, categoryKey] of Object.entries(mapping)) {
      if (!categoryKey) continue;
      (newState as Record<string, unknown>)[categoryKey] = importRows(rows, categoryKey, newState as AppState);
      void sheetName;
    }
    return newState;
  }

  // XLSX / XLS (und alles andere)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        for (const sheetName of wb.SheetNames) {
          const categoryKey = mapping[sheetName];
          if (!categoryKey) continue;
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          (newState as Record<string, unknown>)[categoryKey] = importRows(rows, categoryKey, newState as AppState);
        }
        resolve(newState);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
