import React, { useMemo, useState } from 'react';
import type { AppState } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import {
  CLOUD_THEMES,
  getOpenCloudFieldDefs,
  type CloudTheme,
} from '../cloudFields';
import { CATEGORY_MAP } from '../categories';

interface Props {
  state: AppState;
}

interface Frage {
  nr: number;
  system: string;
  kuerzel: string;
  kategorie: string;
  thema: CloudTheme;
  frage: string;
  feldKey: string;
}

const THEME_COLORS: Record<CloudTheme, string> = {
  'Betrieb & Bereitstellung': 'bg-blue-100 text-blue-800',
  'Lizenz & Kosten':           'bg-purple-100 text-purple-800',
  'Lebenszyklus & Technik':    'bg-amber-100 text-amber-800',
  'Sicherheit & Compliance':   'bg-red-100 text-red-800',
};

export const InterviewFragenliste: React.FC<Props> = ({ state }) => {
  const [groupBy, setGroupBy] = useState<'thema' | 'kategorie'>('thema');
  const [filterThema, setFilterThema] = useState<string>('Alle');

  const fragen = useMemo<Frage[]>(() => {
    const out: Frage[] = [];
    let nr = 1;
    for (const cat of ASSESSABLE_CATEGORIES) {
      const items = state[cat] as unknown as { id: string; kuerzel: string; name: string }[];
      const catLabel = CATEGORY_MAP[cat]?.label ?? cat;
      for (const item of items) {
        const openDefs = getOpenCloudFieldDefs(item as unknown as Record<string, unknown>, cat);
        for (const def of openDefs) {
          out.push({
            nr: nr++,
            system: item.name,
            kuerzel: item.kuerzel,
            kategorie: catLabel,
            thema: def.theme,
            frage: def.question(item.name),
            feldKey: def.key,
          });
        }
      }
    }
    return out;
  }, [state]);

  const filtered = useMemo(() =>
    filterThema === 'Alle' ? fragen : fragen.filter(f => f.thema === filterThema),
    [fragen, filterThema]
  );

  const grouped = useMemo(() => {
    if (groupBy === 'thema') {
      return CLOUD_THEMES
        .map(t => ({ key: t, label: t, items: filtered.filter(f => f.thema === t) }))
        .filter(g => g.items.length > 0);
    } else {
      const cats = ASSESSABLE_CATEGORIES.map(c => CATEGORY_MAP[c]?.label ?? c);
      return cats
        .map(cat => ({ key: cat, label: cat, items: filtered.filter(f => f.kategorie === cat) }))
        .filter(g => g.items.length > 0);
    }
  }, [filtered, groupBy]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHtml(grouped, groupBy, state.customerName));
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Interview- & Workshop-Fragenliste</h2>
          <p className="text-sm text-gray-500">
            Automatisch aus allen Feldern mit Wert „Unklar" oder leer — Basis für LG 4 (Cloud-Readiness-Workshop)
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={fragen.length === 0}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken / PDF
        </button>
      </div>

      {fragen.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="w-10 h-10 mx-auto mb-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-800">Alle Cloud-Felder sind bewertet</p>
          <p className="text-xs text-green-600 mt-1">Keine offenen Fragen mehr — alle Systeme vollständig erfasst.</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 font-medium">
              {fragen.length} offene {fragen.length === 1 ? 'Frage' : 'Fragen'} zu {new Set(fragen.map(f => f.system)).size} Systemen
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-medium text-gray-600">Gruppieren nach:</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as typeof groupBy)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent outline-none"
              >
                <option value="thema">Thema</option>
                <option value="kategorie">Kategorie</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Thema:</label>
              <select
                value={filterThema}
                onChange={e => setFilterThema(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent outline-none"
              >
                <option>Alle</option>
                {CLOUD_THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Fragenliste */}
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{group.items.length}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((f) => (
                    <FrageCard key={`${f.kuerzel}-${f.feldKey}`} frage={f} showThema={groupBy === 'kategorie'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FrageCard: React.FC<{ frage: Frage; showThema: boolean }> = ({ frage, showThema }) => (
  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex gap-3 items-start hover:border-gray-300 transition-colors">
    <span className="text-xs font-bold text-gray-300 w-6 text-right pt-0.5 flex-shrink-0">{frage.nr}</span>
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap gap-2 mb-1.5">
        <span className="text-xs font-mono text-gray-400">{frage.kuerzel}</span>
        <span className="text-xs font-medium text-gray-700">{frage.system}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{frage.kategorie}</span>
        {showThema && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${THEME_COLORS[frage.thema]}`}>
            {frage.thema}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-800 leading-snug">{frage.frage}</p>
    </div>
    {!showThema && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${THEME_COLORS[frage.thema]}`}>
        {frage.thema.split(' & ')[0]}
      </span>
    )}
  </div>
);

function buildPrintHtml(
  grouped: { key: string; label: string; items: Frage[] }[],
  groupBy: string,
  customerName: string
): string {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalFragen = grouped.reduce((n, g) => n + g.items.length, 0);

  const sections = grouped.map(g => `
    <div class="group">
      <h3>${g.label} <span class="badge">${g.items.length}</span></h3>
      <table>
        <thead>
          <tr><th>#</th><th>System</th><th>${groupBy === 'thema' ? 'Kategorie' : 'Thema'}</th><th>Frage</th><th>Antwort</th></tr>
        </thead>
        <tbody>
          ${g.items.map(f => `
            <tr>
              <td class="nr">${f.nr}</td>
              <td><span class="kuerzel">${f.kuerzel}</span><br/><span class="name">${f.system}</span></td>
              <td class="meta">${groupBy === 'thema' ? f.kategorie : f.thema}</td>
              <td class="frage">${f.frage}</td>
              <td class="antwort"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  return `<!DOCTYPE html><html lang="de"><head>
  <meta charset="UTF-8">
  <title>Interview-Fragenliste${customerName ? ' – ' + customerName : ''}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1a1a2e; font-size: 11px; }
    h1 { color: #1a1a2e; margin-bottom: 2px; font-size: 18px; }
    .sub { color: #666; font-size: 11px; margin-bottom: 16px; }
    .meta-bar { display: flex; gap: 24px; margin-bottom: 24px; font-size: 11px; color: #444; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; }
    .meta-bar strong { color: #1a1a2e; }
    .group { margin-bottom: 24px; page-break-inside: avoid; }
    h3 { background: #1a1a2e; color: white; padding: 6px 12px; margin: 0 0 0 0; font-size: 12px; display: flex; align-items: center; gap: 8px; }
    .badge { background: rgba(255,255,255,0.2); color: white; border-radius: 9999px; padding: 1px 8px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 5px 8px; text-align: left; font-size: 10px; color: #374151; border-bottom: 1px solid #d1d5db; }
    td { padding: 6px 8px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
    .nr { width: 24px; color: #9ca3af; font-weight: 700; text-align: right; }
    .kuerzel { font-family: monospace; color: #9ca3af; font-size: 10px; }
    .name { font-weight: 600; color: #1f2937; }
    .meta { color: #6b7280; font-size: 10px; width: 110px; }
    .frage { color: #1f2937; }
    .antwort { width: 180px; border-left: 2px solid #e5e7eb; }
    @media print { body { margin: 16px; } }
  </style>
  </head><body>
  <h1>Interview- & Workshop-Fragenliste</h1>
  <p class="sub">Cloud-Readiness-Analyse · Vorbereitung LG 4</p>
  <div class="meta-bar">
    <span><strong>Kunde:</strong> ${customerName || '–'}</span>
    <span><strong>Stand:</strong> ${today}</span>
    <span><strong>Offene Fragen:</strong> ${totalFragen}</span>
    <span><strong>Gruppierung:</strong> nach ${groupBy === 'thema' ? 'Thema' : 'Kategorie'}</span>
  </div>
  ${sections}
  </body></html>`;
}
