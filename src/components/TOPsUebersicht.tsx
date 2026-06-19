import React, { useMemo, useState } from 'react';
import type { AppState, MeetingTOP } from '../types';

interface Props {
  state: AppState;
  onUpdateTOP: (meetingId: string, topId: string, changes: Partial<MeetingTOP>) => void;
}

interface FlatTOP extends MeetingTOP {
  meetingId: string;
  meetingDatum: string;
  meetingTyp: string;
}

const TYP_COLORS: Record<string, string> = {
  'Jour Fixe':         'bg-blue-100 text-blue-800',
  'Lenkungsausschuss': 'bg-purple-100 text-purple-800',
  'Workshop':          'bg-amber-100 text-amber-800',
  'Sonstiges':         'bg-gray-100 text-gray-600',
};

export const TOPsUebersicht: React.FC<Props> = ({ state, onUpdateTOP }) => {
  const [showErledigt, setShowErledigt] = useState(false);
  const [sortBy, setSortBy] = useState<'faellig' | 'meeting'>('faellig');

  const allTOPs = useMemo<FlatTOP[]>(() => {
    const out: FlatTOP[] = [];
    for (const m of (state.meetings ?? [])) {
      for (const t of m.tops) {
        if (!showErledigt && t.status === 'Erledigt') continue;
        if (!t.titel.trim()) continue;
        out.push({
          ...t,
          meetingId: m.id,
          meetingDatum: m.datum,
          meetingTyp: m.typ,
        });
      }
    }
    if (sortBy === 'faellig') {
      out.sort((a, b) => {
        if (!a.faelligAm && !b.faelligAm) return 0;
        if (!a.faelligAm) return 1;
        if (!b.faelligAm) return -1;
        return a.faelligAm.localeCompare(b.faelligAm);
      });
    } else {
      out.sort((a, b) => b.meetingDatum.localeCompare(a.meetingDatum));
    }
    return out;
  }, [state.meetings, showErledigt, sortBy]);

  const offenCount  = useMemo(() =>
    (state.meetings ?? []).flatMap(m => m.tops).filter(t => t.status === 'Offen' && t.titel.trim()).length,
    [state.meetings]
  );
  const erledigtCount = useMemo(() =>
    (state.meetings ?? []).flatMap(m => m.tops).filter(t => t.status === 'Erledigt' && t.titel.trim()).length,
    [state.meetings]
  );

  const overdue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allTOPs.filter(t => t.status === 'Offen' && t.faelligAm && t.faelligAm < today).length;
  }, [allTOPs]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHtml(allTOPs, state.customerName, showErledigt));
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Aktionspunkte-Übersicht</h2>
          <p className="text-sm text-gray-500">Alle offenen TOPs aus Jour Fixe, Lenkungsausschuss und Workshops auf einen Blick</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={allTOPs.length === 0}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken
        </button>
      </div>

      {/* KPI-Zeile */}
      <div className="flex flex-wrap gap-3">
        <div className={`rounded-lg border px-4 py-2.5 text-center min-w-[90px] ${offenCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`text-2xl font-bold ${offenCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{offenCount}</div>
          <div className="text-xs text-gray-500">Offen</div>
        </div>
        {overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-center min-w-[90px]">
            <div className="text-2xl font-bold text-red-600">{overdue}</div>
            <div className="text-xs text-gray-500">Überfällig</div>
          </div>
        )}
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-center min-w-[90px]">
          <div className="text-2xl font-bold text-green-600">{erledigtCount}</div>
          <div className="text-xs text-gray-500">Erledigt</div>
        </div>
      </div>

      {/* Leer-Zustand */}
      {(state.meetings ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Noch keine Protokolle angelegt.</p>
          <p className="text-xs mt-1">Gehe zu „Protokolle" und lege das erste Meeting an.</p>
        </div>
      )}

      {(state.meetings ?? []).length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showErledigt}
                onChange={e => setShowErledigt(e.target.checked)}
                className="rounded"
              />
              Erledigte anzeigen
            </label>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Sortieren:</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent outline-none"
              >
                <option value="faellig">Nach Fälligkeit</option>
                <option value="meeting">Nach Meeting-Datum</option>
              </select>
            </div>
          </div>

          {/* Tabelle */}
          {allTOPs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {showErledigt ? 'Keine TOPs vorhanden.' : 'Alle Aktionspunkte sind erledigt.'}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600">Aktionspunkt</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 hidden sm:table-cell">Ergebnis</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 w-28">Verantwortlich</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 w-28">Fällig</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 w-24">Status</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 w-28 hidden md:table-cell">Meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {allTOPs.map(top => {
                    const today = new Date().toISOString().split('T')[0];
                    const overdue = top.status === 'Offen' && top.faelligAm && top.faelligAm < today;
                    return (
                      <tr key={`${top.meetingId}-${top.id}`} className={`border-b border-gray-100 hover:bg-gray-50 ${top.status === 'Erledigt' ? 'opacity-50' : ''}`}>
                        <td className="py-2.5 px-4">
                          <p className={`font-medium ${top.status === 'Erledigt' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {top.titel}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[200px] hidden sm:table-cell">
                          <p className="truncate">{top.ergebnis || '–'}</p>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{top.verantwortlich || '–'}</td>
                        <td className="py-2.5 px-3 text-xs">
                          {top.faelligAm ? (
                            <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                              {new Date(top.faelligAm + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              {overdue && <span className="ml-1 text-red-500">!</span>}
                            </span>
                          ) : '–'}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onUpdateTOP(top.meetingId, top.id, {
                              status: top.status === 'Offen' ? 'Erledigt' : 'Offen'
                            })}
                            className={`text-xs px-2 py-1 rounded-full font-medium border transition-colors ${
                              top.status === 'Erledigt'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {top.status}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${TYP_COLORS[top.meetingTyp] ?? 'bg-gray-100 text-gray-600'}`}>
                              {top.meetingTyp}
                            </span>
                            <span className="text-xs text-gray-400">
                              {top.meetingDatum
                                ? new Date(top.meetingDatum + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                : '–'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function buildPrintHtml(tops: FlatTOP[], customerName: string, inclErledigt: boolean): string {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const rows = tops.map(t => {
    const todayStr = new Date().toISOString().split('T')[0];
    const late = t.status === 'Offen' && t.faelligAm && t.faelligAm < todayStr;
    return `<tr>
      <td>${t.titel}</td>
      <td>${t.ergebnis || '–'}</td>
      <td>${t.verantwortlich || '–'}</td>
      <td style="color:${late ? '#dc2626' : 'inherit'}">${t.faelligAm ? new Date(t.faelligAm + 'T12:00:00').toLocaleDateString('de-DE') : '–'}${late ? ' ⚠' : ''}</td>
      <td style="color:${t.status === 'Erledigt' ? '#16a34a' : '#d97706'}">${t.status}</td>
      <td>${t.meetingTyp} · ${t.meetingDatum ? new Date(t.meetingDatum + 'T12:00:00').toLocaleDateString('de-DE') : '–'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="de"><head>
  <meta charset="UTF-8"><title>Aktionspunkte${customerName ? ' – ' + customerName : ''}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1a1a2e; font-size: 11px; }
    h1 { font-size: 16px; margin-bottom: 2px; }
    .meta { color: #666; font-size: 10px; margin-bottom: 16px; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; display: flex; gap: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a2e; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    @media print { body { margin: 16px; } }
  </style>
  </head><body>
  <h1>Aktionspunkte-Übersicht</h1>
  <div class="meta">
    <span><strong>Kunde:</strong> ${customerName || '–'}</span>
    <span><strong>Stand:</strong> ${today}</span>
    <span><strong>Filter:</strong> ${inclErledigt ? 'Alle inkl. Erledigter' : 'Nur offene'}</span>
  </div>
  <table>
    <thead><tr><th>Aktionspunkt</th><th>Ergebnis</th><th>Verantwortlich</th><th>Fällig</th><th>Status</th><th>Meeting</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </body></html>`;
}
