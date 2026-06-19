import React, { useMemo, useRef, useState } from 'react';
import type { AppState } from '../types';
import { assessAll, summarize } from '../cloudReadiness';
import { CATEGORIES } from '../categories';
import { countItemsWithOpenFields } from '../cloudFields';

interface Props {
  state: AppState;
}

const today = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

export const ExecutiveSummary: React.FC<Props> = ({ state }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const assessed = useMemo(() => assessAll(state), [state]);
  const summary  = useMemo(() => summarize(assessed), [assessed]);
  const totalAssets = CATEGORIES.reduce((n, c) => n + (state[c.key] as unknown[]).length, 0);
  const offeneFelder = countItemsWithOpenFields(state);
  const lg = state.liefergegenstaende ?? [];
  const lgAbgenommen = lg.filter(l => l.status === 'Abgenommen').length;

  // Ermittlung: Top-3 Kandidaten für Cloud-Migration
  const topKandidaten = assessed
    .filter(i => i.result.level === 'Hoch')
    .slice(0, 3);

  // Empfehlungsverteilung für Tabelle
  const dispositionRows = Object.entries(summary.dispositionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Editierbarer Freitext für Management-Kommentar
  const [managementNotiz, setManagementNotiz] = useState(
    () => localStorage.getItem('exec-summary-notiz') ?? ''
  );
  const handleNotizChange = (v: string) => {
    setManagementNotiz(v);
    localStorage.setItem('exec-summary-notiz', v);
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintShell(content, state.customerName));
    win.document.close();
    win.print();
  };

  const hasData = totalAssets > 0 || summary.bewertet > 0;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Executive Summary</h2>
          <p className="text-sm text-gray-500">Liefergegenstand 14 — automatisch generierter Entwurf für Geschäftsführung / IT-Leitung</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={!hasData}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken / PDF
        </button>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Noch keine Infrastruktur- oder Cloud-Readiness-Daten erfasst. Fülle zunächst Systeme im Assistenten ein.
        </div>
      )}

      {/* Hinweis zur Nutzung */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 flex gap-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Das ist ein <strong>automatisch generierter Entwurf</strong> — alle Zahlen kommen direkt aus den erfassten Daten. Den Management-Kommentar unten kannst du manuell anpassen; er wird lokal gespeichert.</span>
      </div>

      {/* Dokumentenvorschau */}
      <div ref={printRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Deckbalken */}
        <div className="bg-hi-navy text-white px-8 py-5">
          <div className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-2">Vertraulich · HiSolutions AG</div>
          <h1 className="text-xl font-bold mb-0.5">Executive Summary: Cloud-Strategie</h1>
          <p className="text-white/75 text-sm">Managementgerechte Entscheidungsgrundlage · Liefergegenstand 14</p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm text-white/70">
            <span><span className="font-medium text-white">Kunde:</span> {state.customerName || '–'}</span>
            <span><span className="font-medium text-white">Stand:</span> {today()}</span>
            <span><span className="font-medium text-white">Projektfortschritt:</span> {lgAbgenommen}/{lg.length} LGs abgenommen</span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-7">

          {/* 1. Ausgangssituation */}
          <section>
            <ESHeader nr="1" title="Ausgangssituation" />
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              {state.customerName || 'Der Kunde'} betreibt eine historisch gewachsene IT-Infrastruktur mit insgesamt{' '}
              <strong>{totalAssets} erfassten IT-Komponenten</strong> (Anwendungen, Server, Clients, Netzwerk, ICS/IoT).
              {summary.bewertet > 0
                ? ` Davon wurden ${summary.bewertet} Systeme einer Cloud-Readiness-Bewertung unterzogen.`
                : ''}
              {offeneFelder > 0
                ? ` Bei ${offeneFelder} Systemen besteht noch Klärungsbedarf in einzelnen Cloud-Feldern.`
                : summary.bewertet > 0 ? ' Alle relevanten Cloud-Felder sind vollständig erfasst.' : ''}
            </p>
          </section>

          {/* 2. Cloud-Readiness auf einen Blick */}
          {summary.bewertet > 0 && (
            <section>
              <ESHeader nr="2" title="Cloud-Readiness auf einen Blick" />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                <ESKpi label="Ø Score" value={`${summary.avgScore}`} sub="von 100" color="text-hi-navy" />
                <ESKpi label="Hohe Readiness" value={`${summary.hoch}`} sub={pct(summary.hoch, summary.bewertet)} color="text-green-600" />
                <ESKpi label="Mittlere Readiness" value={`${summary.mittel}`} sub={pct(summary.mittel, summary.bewertet)} color="text-amber-500" />
                <ESKpi label="Niedrige Readiness" value={`${summary.niedrig}`} sub={pct(summary.niedrig, summary.bewertet)} color="text-red-500" />
                {summary.souveraen > 0 && (
                  <ESKpi label="Souveränitätspflicht" value={`${summary.souveraen}`} sub="Systeme" color="text-purple-600" />
                )}
              </div>

              {/* Balken */}
              <div className="mt-4">
                <div className="flex h-5 rounded-lg overflow-hidden bg-gray-100">
                  {summary.hoch    > 0 && <div className="bg-green-500" style={{ width: pct(summary.hoch,    summary.bewertet) }} title={`Hoch: ${summary.hoch}`} />}
                  {summary.mittel  > 0 && <div className="bg-amber-400" style={{ width: pct(summary.mittel,  summary.bewertet) }} title={`Mittel: ${summary.mittel}`} />}
                  {summary.niedrig > 0 && <div className="bg-red-400"   style={{ width: pct(summary.niedrig, summary.bewertet) }} title={`Niedrig: ${summary.niedrig}`} />}
                </div>
                <div className="flex gap-5 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>{pct(summary.hoch, summary.bewertet)} geeignet</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>{pct(summary.mittel, summary.bewertet)} bedingt</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>{pct(summary.niedrig, summary.bewertet)} nicht geeignet</span>
                </div>
              </div>
            </section>
          )}

          {/* 3. Migrationsempfehlungen */}
          {dispositionRows.length > 0 && (
            <section>
              <ESHeader nr="3" title="Empfohlene Migrationsstrategien (6R)" />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-hi-navy">
                      <th className="text-left py-2 text-xs font-semibold text-gray-600 pr-8">Strategie</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-600 w-20">Systeme</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-600 w-20">Anteil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispositionRows.map(([strat, cnt]) => (
                      <tr key={strat} className="border-b border-gray-100">
                        <td className="py-2 text-sm text-gray-800 font-medium">{strat}</td>
                        <td className="py-2 text-right text-sm text-gray-600">{cnt}</td>
                        <td className="py-2 text-right text-sm text-gray-500">{pct(cnt, summary.bewertet)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 4. Top-Kandidaten für Cloud-Migration */}
          {topKandidaten.length > 0 && (
            <section>
              <ESHeader nr="4" title="Systeme mit höchster Cloud-Readiness" />
              <p className="text-xs text-gray-500 mt-1 mb-3">Diese Systeme empfehlen sich als erste Migrationskandidaten.</p>
              <div className="space-y-2">
                {topKandidaten.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
                    <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0">{item.kuerzel}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.categoryLabel}</span>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Score {item.result.score}</span>
                    <span className="text-xs text-gray-600 hidden sm:block">{item.result.empfehlung}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Handlungsempfehlungen */}
          <section>
            <ESHeader nr="5" title="Handlungsempfehlungen" />
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {offeneFelder > 0 && (
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold flex-shrink-0">→</span>
                  <span>Klärung von {offeneFelder} Systemen mit offenen Cloud-Feldern im Cloud-Readiness-Workshop (LG 4) mit IT-Leitung und Fachverantwortlichen.</span>
                </li>
              )}
              {summary.souveraen > 0 && (
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold flex-shrink-0">→</span>
                  <span>{summary.souveraen} Systeme erfordern eine souveräne Cloud-Lösung (C5-Testat / Gaia-X / DE-Rechenzentrum). Dies ist bei der Provider-Auswahl verbindlich zu berücksichtigen.</span>
                </li>
              )}
              {summary.niedrig > 0 && (
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold flex-shrink-0">→</span>
                  <span>{summary.niedrig} Systeme sind aktuell nicht für eine Cloud-Migration geeignet (On-Premises Retain). Separate Roadmap für Modernisierung oder Ablösung empfohlen.</span>
                </li>
              )}
              {topKandidaten.length > 0 && (
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold flex-shrink-0">→</span>
                  <span>{topKandidaten.length} Systeme eignen sich für einen frühen Proof of Concept zur Cloud-Migration (hohe Readiness, geringes Risiko).</span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-hi-navy font-bold flex-shrink-0">→</span>
                <span>Auf Basis dieser Analyse empfiehlt HiSolutions einen hybriden Cloud-Ansatz: cloud-geeignete Systeme migrieren, sicherheitskritische und OT-Systeme On-Premises weiter betreiben.</span>
              </li>
            </ul>
          </section>

          {/* 6. Management-Kommentar */}
          <section>
            <ESHeader nr="6" title="Management-Kommentar / Ergänzungen" />
            <textarea
              value={managementNotiz}
              onChange={e => handleNotizChange(e.target.value)}
              rows={4}
              placeholder="Freitext für Management-Kommentar, projektspezifische Einschätzungen, nächste Schritte…"
              className="mt-3 w-full text-sm border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none resize-none text-gray-700 bg-gray-50"
            />
          </section>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 leading-relaxed">
            <strong>Hinweis:</strong> Dieses Dokument ist ein automatisch generierter Entwurf auf Basis der im IT-Strukturanalyse-Tool erfassten Daten. Die Bewertungen basieren auf einer heuristischen Auswertung und ersetzen nicht die manuelle Validierung im Cloud-Readiness-Workshop. HiSolutions AG, {today()}.
          </div>
        </div>
      </div>
    </div>
  );
};

const ESHeader: React.FC<{ nr: string; title: string }> = ({ nr, title }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-6 h-6 rounded-full bg-hi-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
      {nr}
    </span>
    <h3 className="text-sm font-semibold text-hi-navy">{title}</h3>
  </div>
);

const ESKpi: React.FC<{ label: string; value: string; sub: string; color: string }> = ({ label, value, sub, color }) => (
  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-400">{sub}</div>
    <div className="text-xs text-gray-600 mt-0.5">{label}</div>
  </div>
);

function pct(n: number, total: number): string {
  if (!total) return '0 %';
  return `${Math.round((n / total) * 100)} %`;
}

function buildPrintShell(content: string, customerName: string): string {
  return `<!DOCTYPE html><html lang="de"><head>
  <meta charset="UTF-8">
  <title>Executive Summary${customerName ? ' – ' + customerName : ''}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 11px; }
    .bg-hi-navy { background: #1a1a2e !important; }
    .text-white { color: white !important; }
    h1,h2,h3 { margin: 0; }
    section { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 5px 8px; text-align: left; }
    th { border-bottom: 2px solid #1a1a2e; font-size: 10px; color: #374151; }
    td { border-bottom: 1px solid #f0f0f0; font-size: 11px; }
    .text-right { text-align: right !important; }
    .grid { display: flex; gap: 12px; flex-wrap: wrap; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; min-width: 80px; flex: 1; }
    .kpi-val { font-size: 18px; font-weight: 700; }
    .kpi-sub { font-size: 9px; color: #9ca3af; }
    .kpi-lbl { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .bar { display: flex; height: 14px; border-radius: 8px; overflow: hidden; background: #f3f4f6; margin: 8px 0 4px; }
    .bar-hoch { background: #22c55e; }
    .bar-mittel { background: #fbbf24; }
    .bar-niedrig { background: #f87171; }
    .legend { display: flex; gap: 16px; font-size: 10px; color: #6b7280; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; vertical-align: middle; }
    .top-item { display: flex; align-items: center; gap: 12px; border: 1px solid #d1fae5; background: #f0fdf4; border-radius: 8px; padding: 6px 12px; margin-bottom: 4px; }
    .top-kuerzel { font-family: monospace; font-size: 10px; color: #9ca3af; width: 80px; flex-shrink: 0; }
    .top-name { font-weight: 600; font-size: 11px; flex: 1; }
    .top-score { font-weight: 700; color: #16a34a; background: #dcfce7; padding: 1px 8px; border-radius: 9999px; font-size: 10px; flex-shrink: 0; }
    ul.empf { padding-left: 0; list-style: none; }
    ul.empf li { display: flex; gap: 8px; margin-bottom: 6px; font-size: 11px; }
    ul.empf li span:first-child { flex-shrink: 0; font-weight: 700; }
    .header-inner { padding: 20px 32px; }
    .content { padding: 24px 32px; }
    .esh { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .esh-nr { width: 20px; height: 20px; background: #1a1a2e; color: white; border-radius: 50%; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .esh-title { font-size: 12px; font-weight: 600; color: #1a1a2e; }
    .footer-note { border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 9px; color: #9ca3af; line-height: 1.6; }
    textarea { display: block; width: 100%; min-height: 60px; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; padding: 10px; font-size: 11px; color: #374151; }
    @media print { body { margin: 0; } .bg-hi-navy { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
  </head><body>${content}</body></html>`;
}
