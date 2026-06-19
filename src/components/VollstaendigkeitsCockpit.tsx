import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';
import {
  computeCompleteness,
  summarizeCompleteness,
  type CategoryCompleteness,
  type CompletenessStatus,
} from '../completeness';

interface Props {
  state: AppState;
  onNavigate: (tab: string) => void;
}

const STATUS_STYLE: Record<CompletenessStatus, { edge: string; bar: string; chip: string; label: string }> = {
  'Grün': { edge: 'border-l-emerald-500', bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800', label: 'Vollständig' },
  'Gelb': { edge: 'border-l-amber-500', bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800', label: 'Teilweise' },
  'Rot':  { edge: 'border-l-red-500', bar: 'bg-red-500', chip: 'bg-red-100 text-red-700', label: 'Offen' },
};

export const VollstaendigkeitsCockpit: React.FC<Props> = ({ state, onNavigate }) => {
  const rows = useMemo(() => computeCompleteness(state), [state]);
  const summary = useMemo(() => summarizeCompleteness(rows), [rows]);

  const handlePrint = () => {
    const body = `${printHeader('Erfassungsfortschritt', state.customerName)}
      <p>${summary.categoriesComplete}/${summary.categoriesTotal} Kategorien vollständig &middot; ${summary.itemsWithUnklar} Einträge mit offenen Feldern</p>
      <table><thead><tr><th>Kategorie</th><th>Einträge</th><th>Vollständig</th><th>Mit offenen Feldern</th><th>Fortschritt</th><th>Status</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(r.label)}</td><td>${r.total}</td><td>${r.complete}</td><td>${r.withUnklar}</td><td>${r.pct} %</td><td style="color:${r.status === 'Grün' ? '#16a34a' : r.status === 'Gelb' ? '#d97706' : '#dc2626'};font-weight:700">${esc(STATUS_STYLE[r.status].label)}</td></tr>`).join('')}
      </tbody></table>${printFooter()}`;
    openPrintWindow(`Erfassungsfortschritt — ${state.customerName || 'Kunde'}`, body);
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Erfassungsfortschritt</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Zeigt für jede Kategorie, wie viele Einträge noch offene <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">Unklar</span>- oder
            leere Cloud-Felder haben. So ist auf einen Blick erkennbar, wo noch Klärungsbedarf besteht.
          </p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
      </div>

      {/* Gesamtfortschritt */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Gesamtfortschritt aller bewertbaren Kategorien</span>
          <span className="text-sm font-bold text-hi-navy">{summary.avgPct} %</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${summary.avgPct >= 80 ? 'bg-emerald-500' : summary.avgPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${summary.avgPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
          <span><strong className="text-hi-navy">{summary.categoriesComplete}</strong> von {summary.categoriesTotal} Kategorien vollständig</span>
          <span><strong className="text-hi-navy">{summary.itemsTotal}</strong> Einträge gesamt</span>
          <span className={summary.itemsWithUnklar > 0 ? 'text-amber-600' : ''}><strong>{summary.itemsWithUnklar}</strong> mit offenen Feldern</span>
        </div>
      </div>

      {/* Kategorie-Kacheln */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <CockpitCard key={r.key} row={r} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
        <span className="font-medium text-gray-600">Ampel:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Grün — ≥ 80 % der Felder erfasst</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Gelb — 40–79 % erfasst</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Rot — &lt; 40 % erfasst oder keine Einträge</span>
      </div>
    </div>
  );
};

const CockpitCard: React.FC<{ row: CategoryCompleteness; onNavigate: (tab: string) => void }> = ({ row, onNavigate }) => {
  const style = STATUS_STYLE[row.status];
  const empty = row.total === 0;

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${style.edge} rounded-xl p-4 shadow-sm flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{row.label}</h3>
          <p className="text-xs text-gray-400">{row.total} {row.total === 1 ? 'Eintrag' : 'Einträge'}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${style.chip}`}>{style.label}</span>
      </div>

      {empty ? (
        <p className="text-xs text-red-500">Noch keine Einträge erfasst.</p>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Felder erfasst</span>
              <span className="text-xs font-semibold text-gray-700">{row.pct} %</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span><strong className="text-emerald-600">{row.complete}</strong> vollständig</span>
            {row.withUnklar > 0 && <span><strong className="text-amber-600">{row.withUnklar}</strong> offen</span>}
            {row.empty > 0 && <span><strong className="text-red-500">{row.empty}</strong> unbearbeitet</span>}
          </div>
        </>
      )}

      <button
        onClick={() => onNavigate('fragenliste')}
        className="mt-auto self-start flex items-center gap-1 text-xs font-medium text-hi-teal hover:text-hi-navy transition-colors"
      >
        Zur Fragenliste
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </button>
    </div>
  );
};
