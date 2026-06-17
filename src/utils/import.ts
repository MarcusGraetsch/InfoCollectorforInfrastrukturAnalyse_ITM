import * as XLSX from 'xlsx';
import type { AppState } from '../types';
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
          for (const f of cat.fields) {
            fieldMap[f.label] = f.key;
          }

          const imported = rows.map((row) => {
            const item: Record<string, unknown> = { id: generateId() };
            for (const [label, key] of Object.entries(fieldMap)) {
              const val = row[label];
              const fieldDef = cat.fields.find((f) => f.key === key);
              if (fieldDef?.type === 'multiref') {
                item[key] = val ? String(val).split(',').map((s) => s.trim()).filter(Boolean) : [];
              } else {
                item[key] = val ?? '';
              }
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
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
