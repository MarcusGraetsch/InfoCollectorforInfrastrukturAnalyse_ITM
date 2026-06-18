import React, { useEffect, useState } from 'react';
import type { CategoryKey } from '../types';
import { CATEGORIES } from '../categories';
import { analyzeFile } from '../utils/importAnalyzer';
import type { SheetAnalysis, ImportAnalysis } from '../utils/importAnalyzer';

interface Props {
  file: File;
  onConfirm: (mapping: Record<string, CategoryKey | null>) => void;
  onCancel: () => void;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  excel: 'Excel-Datei',
  csv: 'CSV-Datei',
  txt: 'Textdatei',
  docx: 'Word-Dokument',
  pdf: 'PDF-Dokument',
  unknown: 'Datei',
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  columns:  { label: 'Spalten erkannt',  color: 'emerald' },
  keywords: { label: 'Inhalt analysiert', color: 'sky'     },
  filename: { label: 'Dateiname',        color: 'amber'   },
};

function ConfidenceBadge({ confidence, source }: { confidence: number; source: string }) {
  const col =
    confidence >= 60 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    confidence >= 30 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                       'bg-red-100 text-red-600 border-red-200';
  const src = SOURCE_LABELS[source] ?? SOURCE_LABELS.filename;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${col}`}>
      {confidence}% · {src.label}
    </span>
  );
}

function AutoBadge({ category }: { category: CategoryKey }) {
  const label = CATEGORIES.find(c => c.key === category)?.label ?? category;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {label}
    </span>
  );
}

function LimitedAnalysisNote({ fileType }: { fileType: string }) {
  if (fileType !== 'docx' && fileType !== 'pdf') return null;
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        <strong>Hinweis:</strong> {fileType === 'docx' ? 'Word-Dokumente' : 'PDF-Dateien'} können
        nicht vollständig automatisch ausgelesen werden. Der Vorschlag basiert auf dem <strong>Dateinamen</strong>.
        Bitte Zuordnung manuell prüfen. Für präzise Erkennung empfiehlt sich ein Export als <strong>CSV oder Excel</strong>.
      </span>
    </div>
  );
}

export const ImportWizard: React.FC<Props> = ({ file, onConfirm, onCancel }) => {
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, CategoryKey | null>>({});

  useEffect(() => {
    analyzeFile(file)
      .then(result => {
        setAnalysis(result);
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

  const sheets = analysis?.sheets ?? [];
  const fileType = analysis?.fileType ?? 'unknown';
  const fileTypeLabel = FILE_TYPE_LABELS[fileType] ?? 'Datei';

  const autoCount = sheets.filter(s => s.suggestedCategory !== null).length;
  const needsManual = sheets.filter(s => s.suggestedCategory === null).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-hi-navy px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{fileTypeLabel} analysieren</h2>
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

              {/* Zusammenfassung */}
              <div className="flex flex-wrap gap-2 items-center">
                {autoCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {autoCount} automatisch erkannt
                  </span>
                )}
                {needsManual > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {needsManual} bitte manuell zuordnen
                  </span>
                )}
                <span className="text-xs text-hi-slate ml-auto">
                  {sheets.length} {sheets.length === 1 ? 'Tabelle' : 'Tabellen'} gefunden
                </span>
              </div>

              <LimitedAnalysisNote fileType={fileType} />

              {/* Pro Sheet / Datei */}
              {sheets.map((sheet: SheetAnalysis) => {
                const isAutoDetected = sheet.suggestedCategory !== null;
                const currentMapping = mapping[sheet.sheetName];
                const borderColor = isAutoDetected
                  ? 'border-emerald-200'
                  : 'border-amber-200';

                return (
                  <div key={sheet.sheetName} className={`rounded-xl border-2 overflow-hidden ${borderColor}`}>

                    {/* Sheet-Header */}
                    <div className={`px-4 py-3 flex items-start justify-between gap-3 ${
                      isAutoDetected ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-hi-navy text-sm truncate">{sheet.sheetName}</span>
                          {sheet.rowCount > 0 && (
                            <span className="text-hi-slate text-xs">({sheet.rowCount} Zeilen)</span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {isAutoDetected && sheet.suggestedCategory && (
                            <AutoBadge category={sheet.suggestedCategory} />
                          )}
                          {!isAutoDetected && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              Bitte zuordnen
                            </span>
                          )}
                          {sheet.confidence > 0 && (
                            <ConfidenceBadge confidence={sheet.confidence} source={sheet.source} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details + Dropdown */}
                    <div className="px-4 py-3 space-y-2.5 bg-white">
                      {sheet.matchedFields.length > 0 && (
                        <p className="text-xs text-hi-slate">
                          <span className="font-medium text-hi-navy">Erkannte Felder:</span>{' '}
                          {sheet.matchedFields.join(', ')}
                        </p>
                      )}
                      {sheet.columns.length > 0 && (
                        <p className="text-xs text-hi-slate/70">
                          <span className="font-medium">Spalten:</span>{' '}
                          {sheet.columns.slice(0, 8).join(', ')}
                          {sheet.columns.length > 8 ? ` +${sheet.columns.length - 8} weitere` : ''}
                        </p>
                      )}

                      {/* Dropdown — immer sichtbar, aber visuell unterschieden */}
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs font-medium text-hi-navy whitespace-nowrap">
                          {isAutoDetected ? 'Zuordnung überschreiben:' : 'Kategorie wählen:'}
                        </label>
                        <select
                          value={currentMapping ?? ''}
                          onChange={e => setMapping(prev => ({
                            ...prev,
                            [sheet.sheetName]: (e.target.value as CategoryKey) || null,
                          }))}
                          className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent bg-white text-hi-navy ${
                            isAutoDetected
                              ? 'border-emerald-300 text-emerald-800'
                              : 'border-amber-300'
                          }`}
                        >
                          <option value="">— Nicht importieren —</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat.key} value={cat.key}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-hi-slate hover:text-hi-navy transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(mapping)}
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
