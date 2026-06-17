import React, { useEffect, useState } from 'react';
import type { CategoryKey } from '../types';
import { CATEGORIES } from '../categories';
import { analyzeExcel } from '../utils/importAnalyzer';
import type { SheetAnalysis } from '../utils/importAnalyzer';

interface Props {
  file: File;
  onConfirm: (mapping: Record<string, CategoryKey | null>) => void;
  onCancel: () => void;
}

export const ImportWizard: React.FC<Props> = ({ file, onConfirm, onCancel }) => {
  const [sheets, setSheets] = useState<SheetAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, CategoryKey | null>>({});

  useEffect(() => {
    analyzeExcel(file)
      .then(result => {
        setSheets(result.sheets);
        const initial: Record<string, CategoryKey | null> = {};
        for (const s of result.sheets) {
          initial[s.sheetName] = s.suggestedCategory;
        }
        setMapping(initial);
        setLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setLoading(false);
      });
  }, [file]);

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-hi-navy px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Excel-Datei analysieren</h2>
            <p className="text-white/60 text-sm mt-0.5">{file.name}</p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-4 border-hi-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-hi-slate text-sm">Datei wird analysiert…</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              <p className="text-hi-slate text-sm">
                Es wurden <strong className="text-hi-navy">{sheets.length} Tabellen</strong> gefunden.
                Wählen Sie für jede Tabelle die passende BSI-Kategorie oder "Nicht importieren".
              </p>
              {sheets.map(sheet => (
                <div key={sheet.sheetName} className="rounded-xl border border-hi-accent/20 overflow-hidden">
                  <div className="bg-hi-gray px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-hi-navy text-sm">{sheet.sheetName}</span>
                      <span className="text-hi-slate text-xs ml-2">({sheet.rowCount} Zeilen)</span>
                    </div>
                    {sheet.confidence > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        sheet.confidence >= 50 ? 'bg-emerald-100 text-emerald-700' :
                        sheet.confidence >= 25 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sheet.confidence}% Treffer
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {sheet.matchedFields.length > 0 && (
                      <p className="text-xs text-hi-slate">
                        Erkannte Felder: {sheet.matchedFields.join(', ')}
                      </p>
                    )}
                    {sheet.columns.length > 0 && (
                      <p className="text-xs text-hi-slate/70">
                        Spalten: {sheet.columns.slice(0, 8).join(', ')}{sheet.columns.length > 8 ? ` +${sheet.columns.length - 8}` : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-xs font-medium text-hi-navy whitespace-nowrap">Importieren als:</label>
                      <select
                        value={mapping[sheet.sheetName] ?? ''}
                        onChange={e => setMapping(prev => ({ ...prev, [sheet.sheetName]: (e.target.value as CategoryKey) || null }))}
                        className="flex-1 text-sm border border-hi-accent/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent bg-white text-hi-navy"
                      >
                        <option value="">— Nicht importieren —</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat.key} value={cat.key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="px-6 py-4 border-t border-hi-accent/20 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-hi-slate hover:text-hi-navy transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-sm font-bold bg-hi-accent text-white rounded-lg hover:bg-hi-blue transition-colors"
            >
              Import starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
