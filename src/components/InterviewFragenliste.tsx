import React, { useMemo, useState, useEffect } from 'react';
import type { AppState } from '../types';
import { esc, openPrintWindow } from '../utils/safePrint';
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

const LS_ANSWERED = 'it-sa-fragen-answered';
function loadAnswered(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_ANSWERED) ?? '[]')); } catch { return new Set(); }
}

export const InterviewFragenliste: React.FC<Props> = ({ state }) => {
  const [groupBy, setGroupBy] = useState<'thema' | 'kategorie'>('thema');
  const [filterThema, setFilterThema] = useState<string>('Alle');
  const [hideAnswered, setHideAnswered] = useState(false);
  const [answered, setAnswered] = useState<Set<string>>(loadAnswered);

  useEffect(() => {
    localStorage.setItem(LS_ANSWERED, JSON.stringify([...answered]));
  }, [answered]);

  const toggleAnswered = (key: string) => {
    setAnswered(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const filtered = useMemo(() => {
    let list = filterThema === 'Alle' ? fragen : fragen.filter(f => f.thema === filterThema);
    if (hideAnswered) list = list.filter(f => !answered.has(`${f.kuerzel}-${f.feldKey}`));
    return list;
  }, [fragen, filterThema, hideAnswered, answered]);

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
    openPrintWindow(
      `Interview-Fragenliste${state.customerName ? ' – ' + state.customerName : ''}`,
      buildPrintBody(grouped, groupBy, state.customerName)
    );
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
              {answered.size > 0 && <span className="ml-2 text-green-700 font-semibold">· {answered.size} beantwortet</span>}
            </div>
            {answered.size > 0 && (
              <button
                onClick={() => setHideAnswered(h => !h)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${hideAnswered ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
              >
                {hideAnswered ? '✓ Nur offene' : 'Beantwortete ausblenden'}
              </button>
            )}
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
                  {group.items.map((f) => {
                    const aKey = `${f.kuerzel}-${f.feldKey}`;
                    return (
                      <FrageCard
                        key={aKey}
                        frage={f}
                        showThema={groupBy === 'kategorie'}
                        isAnswered={answered.has(aKey)}
                        onToggleAnswered={() => toggleAnswered(aKey)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FrageCard: React.FC<{ frage: Frage; showThema: boolean; isAnswered: boolean; onToggleAnswered: () => void }> = ({ frage, showThema, isAnswered, onToggleAnswered }) => (
  <div className={`bg-white border rounded-lg px-4 py-3 flex gap-3 items-start transition-all ${isAnswered ? 'border-green-200 bg-green-50/40 opacity-75' : 'border-gray-200 hover:border-gray-300'}`}>
    <span className="text-xs font-bold text-gray-300 w-6 text-right pt-0.5 flex-shrink-0">{frage.nr}</span>
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap gap-2 mb-1.5">
        <span className="text-xs font-mono text-gray-400">{frage.kuerzel}</span>
        <span className={`text-xs font-medium ${isAnswered ? 'line-through text-gray-400' : 'text-gray-700'}`}>{frage.system}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{frage.kategorie}</span>
        {showThema && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${THEME_COLORS[frage.thema]}`}>
            {frage.thema}
          </span>
        )}
      </div>
      <p className={`text-sm leading-snug ${isAnswered ? 'line-through text-gray-400' : 'text-gray-800'}`}>{frage.frage}</p>
    </div>
    <button
      onClick={onToggleAnswered}
      title={isAnswered ? 'Als offen markieren' : 'Als beantwortet markieren'}
      className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${isAnswered ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : 'bg-gray-50 text-gray-500 border-gray-300 hover:border-green-300 hover:text-green-600'}`}
    >
      {isAnswered ? '✓ Geklärt' : 'Klären'}
    </button>
    {!showThema && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${THEME_COLORS[frage.thema]}`}>
        {frage.thema.split(' & ')[0]}
      </span>
    )}
  </div>
);

function buildPrintBody(
  grouped: { key: string; label: string; items: Frage[] }[],
  groupBy: string,
  customerName: string
): string {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalFragen = grouped.reduce((n, g) => n + g.items.length, 0);

  const sections = grouped.map(g => `
    <div style="margin-bottom:24px;page-break-inside:avoid">
      <h3 style="background:#1a1a2e;color:white;padding:6px 12px;margin:0;font-size:12px;display:flex;align-items:center;gap:8px">
        ${esc(g.label)} <span style="background:rgba(255,255,255,0.2);color:white;border-radius:9999px;padding:1px 8px;font-size:10px">${g.items.length}</span>
      </h3>
      <table>
        <thead>
          <tr><th>#</th><th>System</th><th>${groupBy === 'thema' ? 'Kategorie' : 'Thema'}</th><th>Frage</th><th>Antwort</th></tr>
        </thead>
        <tbody>
          ${g.items.map(f => `
            <tr>
              <td style="width:24px;color:#9ca3af;font-weight:700;text-align:right">${f.nr}</td>
              <td><span style="font-family:monospace;color:#9ca3af;font-size:10px">${esc(f.kuerzel)}</span><br/><span style="font-weight:600;color:#1f2937">${esc(f.system)}</span></td>
              <td style="color:#6b7280;font-size:10px;width:110px">${esc(groupBy === 'thema' ? f.kategorie : f.thema)}</td>
              <td style="color:#1f2937">${esc(f.frage)}</td>
              <td style="width:180px;border-left:2px solid #e5e7eb"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  return `
  <h1>Interview- &amp; Workshop-Fragenliste</h1>
  <p style="color:#666;font-size:11px;margin-bottom:16px">Cloud-Readiness-Analyse · Vorbereitung LG 4</p>
  <div style="display:flex;gap:24px;margin-bottom:24px;font-size:11px;color:#444;border-bottom:2px solid #1a1a2e;padding-bottom:8px">
    <span><strong>Kunde:</strong> ${esc(customerName || '–')}</span>
    <span><strong>Stand:</strong> ${esc(today)}</span>
    <span><strong>Offene Fragen:</strong> ${totalFragen}</span>
    <span><strong>Gruppierung:</strong> nach ${groupBy === 'thema' ? 'Thema' : 'Kategorie'}</span>
  </div>
  ${sections}`;
}
