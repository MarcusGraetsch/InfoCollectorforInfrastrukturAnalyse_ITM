import * as XLSX from 'xlsx';
import { CATEGORIES } from '../categories';
import type { CategoryKey } from '../types';

export interface SheetAnalysis {
  sheetName: string;
  suggestedCategory: CategoryKey | null;
  confidence: number; // 0-100
  matchedFields: string[];
  rowCount: number;
  columns: string[];
}

export interface ImportAnalysis {
  sheets: SheetAnalysis[];
}

function scoreSheet(columns: string[], categoryKey: CategoryKey): { score: number; matchedFields: string[] } {
  const cat = CATEGORIES.find(c => c.key === categoryKey)!;
  const matchedFields: string[] = [];
  let score = 0;
  for (const field of cat.fields) {
    const matched = columns.some(col => {
      const c = col.toLowerCase().trim();
      const l = field.label.toLowerCase();
      const k = field.key.toLowerCase();
      return c === l || c === k || c.includes(l) || l.includes(c) || c.includes(k);
    });
    if (matched) {
      matchedFields.push(field.label);
      score += field.required ? 3 : 1;
    }
  }
  return { score, matchedFields };
}

export function analyzeExcel(file: File): Promise<ImportAnalysis> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const sheets: SheetAnalysis[] = wb.SheetNames.map(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
          const rowCount = rows.length;
          
          let bestCategory: CategoryKey | null = null;
          let bestScore = 0;
          let bestMatchedFields: string[] = [];
          
          for (const cat of CATEGORIES) {
            const { score, matchedFields } = scoreSheet(columns, cat.key);
            let nameBonus = 0;
            const sn = sheetName.toLowerCase();
            const cl = cat.label.toLowerCase();
            if (sn === cl || sn.includes(cl.substring(0, 5)) || cl.includes(sn.substring(0, 5))) {
              nameBonus = 5;
            }
            const total = score + nameBonus;
            if (total > bestScore) {
              bestScore = total;
              bestCategory = cat.key;
              bestMatchedFields = matchedFields;
            }
          }
          
          const maxPossibleScore = 15;
          const confidence = bestScore > 0 ? Math.min(100, Math.round((bestScore / maxPossibleScore) * 100)) : 0;
          
          return {
            sheetName,
            suggestedCategory: confidence >= 15 ? bestCategory : null,
            confidence,
            matchedFields: bestMatchedFields,
            rowCount,
            columns,
          };
        });
        
        resolve({ sheets });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
