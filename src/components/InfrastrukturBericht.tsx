import React, { useMemo, useRef } from 'react';
import type { AppState } from '../types';
import { assessAll, summarize } from '../cloudReadiness';
import { CATEGORIES } from '../categories';

interface Props {
  state: AppState;
}

const LEVEL_COLORS: Record<string, string> = {
  'Hoch':       '#16a34a',
  'Mittel':     '#d97706',
  'Niedrig':    '#dc2626',
  'Unbewertet': '#9ca3af',
};

const LEVEL_BG: Record<string, string> = {
  'Hoch':       'bg-green-100 text-green-800',
  'Mittel':     'bg-amber-100 text-amber-800',
  'Niedrig':    'bg-red-100 text-red-800',
  'Unbewertet': 'bg-gray-100 text-gray-500',
};

export const InfrastrukturBericht: React.FC<Props> = ({ state }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const assessed = useMemo(() => assessAll(state), [state]);
  const summary = useMemo(() => summarize(assessed), [assessed]);

  const totalAssets = CATEGORIES.reduce((n, cat) => n + (state[cat.key] as unknown[]).length, 0);

  const unclearCount = assessed.filter(i =>
    Object.values(i).some(v => v === 'Unklar')
  ).length;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintShell(content, state.customerName));
    win.document.close();
    win.print();
  };

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Infrastruktur-Bericht</h2>
          <p className="text-sm text-gray-500">Liefergegenstand 2 & 3 · automatisch generiert aus den erfassten Daten</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken / PDF
        </button>
      </div>

      {totalAssets === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Noch keine Infrastruktur-Daten erfasst. Nutze den Assistenten oder die Detailansicht, um Systeme einzutragen — der Bericht wird dann automatisch befüllt.
        </div>
      )}

      {/* Preview */}
      <div ref={printRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Deckblatt */}
        <div className="bg-hi-navy text-white px-8 py-6">
          <div className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-2">HiSolutions AG · Cloud-Strategie-Projekt</div>
          <h1 className="text-2xl font-bold mb-1">Bericht: Analyse der technischen Infrastruktur</h1>
          <p className="text-white/80 text-sm">Liefergegenstände 2 & 3 — Tabellarische Auflistung & Infrastruktur-Landkarte</p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/70">
            <span><span className="font-medium text-white">Kunde:</span> {state.customerName || '–'}</span>
            <span><span className="font-medium text-white">Stand:</span> {today}</span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">

          {/* 1. Zusammenfassung */}
          <section>
            <SectionHeader nr="1" title="Zusammenfassung" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <KpiCard label="Erfasste Assets" value={totalAssets} color="text-hi-navy" />
              <KpiCard label="Bewertet (Cloud)" value={summary.bewertet} color="text-hi-navy" />
              <KpiCard label="Offen / Unklar" value={unclearCount} color="text-amber-600" />
              <KpiCard label="Ø Readiness-Score" value={summary.bewertet > 0 ? `${summary.avgScore}` : '–'} color="text-hi-navy" />
            </div>

            {summary.bewertet > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Cloud-Readiness-Verteilung (bewertete Systeme)</p>
                <ReadinessBar hoch={summary.hoch} mittel={summary.mittel} niedrig={summary.niedrig} total={summary.bewertet} />
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{summary.hoch} Hoch</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />{summary.mittel} Mittel</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{summary.niedrig} Niedrig</span>
                  {summary.unbewertet > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />{summary.unbewertet} Unbewertet</span>}
                </div>
              </div>
            )}
          </section>

          {/* 2. Asset-Tabellen je Kategorie */}
          <section>
            <SectionHeader nr="2" title="Asset-Übersicht nach Kategorie" />
            <div className="space-y-6 mt-4">
              {CATEGORIES.map(cat => {
                const items = state[cat.key] as unknown as { id: string; kuerzel: string; name: string; erlaeuterung: string; status?: string }[];
                if (items.length === 0) return null;
                return (
                  <CategoryTable key={cat.key} label={cat.label} items={items} />
                );
              })}
              {totalAssets === 0 && (
                <p className="text-sm text-gray-400 italic">Keine Assets erfasst.</p>
              )}
            </div>
          </section>

          {/* 3. Cloud-Readiness-Tabelle */}
          {assessed.length > 0 && (
            <section>
              <SectionHeader nr="3" title="Cloud-Readiness-Bewertung" />
              <p className="text-xs text-gray-500 mt-1 mb-4">Automatische Heuristik auf Basis der erfassten Cloud-Felder. Schwellen: ≥70 = Hoch, 45–69 = Mittel, &lt;45 = Niedrig.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Kürzel</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Typ</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Bereitstellung</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Score</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Readiness</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Empfehlung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessed.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono text-gray-500">{item.kuerzel}</td>
                        <td className="py-2 px-3 font-medium text-gray-800 max-w-[180px] truncate">{item.name}</td>
                        <td className="py-2 px-3 text-gray-600">{item.categoryLabel}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-[120px] truncate">{item.bereitstellung || '–'}</td>
                        <td className="py-2 px-3">
                          {item.result.level !== 'Unbewertet' ? (
                            <span className="font-bold" style={{ color: LEVEL_COLORS[item.result.level] }}>
                              {item.result.score}
                            </span>
                          ) : '–'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_BG[item.result.level]}`}>
                            {item.result.level}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 max-w-[140px] truncate">{item.result.empfehlung}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 4. Offene Punkte */}
          {unclearCount > 0 && (
            <section>
              <SectionHeader nr="4" title="Offene Punkte / Klärungsbedarf" />
              <p className="text-xs text-gray-500 mt-1 mb-3">Systeme mit mindestens einem Feld mit Wert „Unklar" — Klärung in Folge-Workshops erforderlich.</p>
              <div className="space-y-1">
                {assessed.filter(i => Object.values(i).some(v => v === 'Unklar')).map(item => {
                  const unklar = Object.entries(item)
                    .filter(([k, v]) => v === 'Unklar' && k !== 'result')
                    .map(([k]) => FIELD_LABELS[k] ?? k);
                  return (
                    <div key={item.id} className="flex items-start gap-3 py-1.5 border-b border-gray-100">
                      <span className="font-mono text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{item.kuerzel}</span>
                      <span className="text-sm font-medium text-gray-800 flex-1">{item.name}</span>
                      <span className="text-xs text-amber-700 flex-shrink-0">Unklar: {unklar.join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Methodischer Hinweis */}
          <section className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong>Hinweis zur Methodik:</strong> Die Cloud-Readiness-Bewertung basiert auf einer heuristischen Auswertung der erfassten Attribute (Bereitstellung, Lizenz, Migrationskomplexität, Lebenszyklus, Schutzbedarf, Internetfähigkeit, Datensouveränität). Sie dient als Orientierung und Gesprächsgrundlage — eine abschließende Bewertung erfolgt im Cloud-Readiness-Workshop (LG 4) gemeinsam mit den Verantwortlichen.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ nr: string; title: string }> = ({ nr, title }) => (
  <div className="flex items-center gap-3">
    <span className="w-7 h-7 rounded-full bg-hi-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
      {nr}
    </span>
    <h3 className="text-base font-semibold text-hi-navy">{title}</h3>
  </div>
);

const KpiCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
  </div>
);

const ReadinessBar: React.FC<{ hoch: number; mittel: number; niedrig: number; total: number }> = ({ hoch, mittel, niedrig, total }) => (
  <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
    {hoch > 0    && <div className="bg-green-500 transition-all" style={{ width: `${(hoch   / total) * 100}%` }} />}
    {mittel > 0  && <div className="bg-amber-400 transition-all" style={{ width: `${(mittel / total) * 100}%` }} />}
    {niedrig > 0 && <div className="bg-red-400 transition-all"   style={{ width: `${(niedrig/ total) * 100}%` }} />}
  </div>
);

const CategoryTable: React.FC<{ label: string; items: { id: string; kuerzel: string; name: string; erlaeuterung: string; status?: string }[] }> = ({ label, items }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-1.5 px-3 font-semibold text-gray-600 w-28">Kürzel</th>
            <th className="text-left py-1.5 px-3 font-semibold text-gray-600">Name</th>
            <th className="text-left py-1.5 px-3 font-semibold text-gray-600">Erläuterung</th>
            {items.some(i => i.status) && (
              <th className="text-left py-1.5 px-3 font-semibold text-gray-600 w-24">Status</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-1.5 px-3 font-mono text-gray-500">{item.kuerzel}</td>
              <td className="py-1.5 px-3 font-medium text-gray-800">{item.name}</td>
              <td className="py-1.5 px-3 text-gray-600 max-w-xs truncate">{item.erlaeuterung || '–'}</td>
              {item.status !== undefined && (
                <td className="py-1.5 px-3 text-gray-500">{item.status}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FIELD_LABELS: Record<string, string> = {
  schutzbedarf: 'Schutzbedarf',
  bereitstellung: 'Bereitstellung',
  lizenzCloudfaehig: 'Lizenz cloudfähig',
  migrationskomplexitaet: 'Migrationskomplexität',
  lebenszyklus: 'Lebenszyklus',
  internetfaehig: 'Internetfähig',
  datensouveraenitaet: 'Datensouveränität',
  cloudEignung: 'Cloud-Eignung',
};

function buildPrintShell(content: string, customerName: string): string {
  return `<!DOCTYPE html><html lang="de"><head>
  <meta charset="UTF-8">
  <title>Infrastruktur-Bericht${customerName ? ' – ' + customerName : ''}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #1a1a2e; font-size: 12px; }
    .bg-hi-navy { background: #1a1a2e !important; color: white !important; }
    .text-white { color: white !important; }
    .text-white\\/60 { color: rgba(255,255,255,0.6) !important; }
    .text-white\\/80 { color: rgba(255,255,255,0.8) !important; }
    .bg-gray-50 { background: #f9fafb !important; }
    .bg-gray-100 { background: #f3f4f6 !important; }
    .bg-green-100 { background: #dcfce7 !important; }
    .bg-amber-100 { background: #fef3c7 !important; }
    .bg-red-100 { background: #fee2e2 !important; }
    .text-green-800 { color: #166534 !important; }
    .text-amber-800 { color: #92400e !important; }
    .text-red-800 { color: #991b1b !important; }
    .text-gray-400 { color: #9ca3af !important; }
    .text-gray-500 { color: #6b7280 !important; }
    .text-gray-600 { color: #4b5563 !important; }
    .text-gray-700 { color: #374151 !important; }
    .text-gray-800 { color: #1f2937 !important; }
    .text-hi-navy { color: #1a1a2e !important; }
    .text-amber-600 { color: #d97706 !important; }
    .border { border: 1px solid #e5e7eb !important; }
    .border-b { border-bottom: 1px solid #e5e7eb !important; }
    .border-gray-100 { border-color: #f3f4f6 !important; }
    .border-gray-200 { border-color: #e5e7eb !important; }
    .rounded-full { border-radius: 9999px !important; }
    .rounded-lg { border-radius: 8px !important; }
    .px-8 { padding-left: 32px !important; padding-right: 32px !important; }
    .py-6 { padding-top: 24px !important; padding-bottom: 24px !important; }
    .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
    .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
    .py-1\\.5 { padding-top: 6px !important; padding-bottom: 6px !important; }
    .p-3 { padding: 12px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-6 { gap: 24px !important; }
    .mt-1 { margin-top: 4px !important; }
    .mt-2 { margin-top: 8px !important; }
    .mt-4 { margin-top: 16px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mb-2 { margin-bottom: 8px !important; }
    .mb-3 { margin-bottom: 12px !important; }
    .mb-4 { margin-bottom: 16px !important; }
    .space-y-1 > * + * { margin-top: 4px !important; }
    .space-y-6 > * + * { margin-top: 24px !important; }
    .space-y-8 > * + * { margin-top: 32px !important; }
    .grid { display: grid !important; }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
    .flex { display: flex !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-center { justify-content: center !important; }
    .flex-1 { flex: 1 !important; }
    .flex-shrink-0 { flex-shrink: 0 !important; }
    .font-bold { font-weight: 700 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .font-mono { font-family: monospace !important; }
    .text-xs { font-size: 11px !important; }
    .text-sm { font-size: 12px !important; }
    .text-base { font-size: 14px !important; }
    .text-2xl { font-size: 22px !important; }
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }
    .leading-relaxed { line-height: 1.6 !important; }
    .w-7 { width: 28px !important; }
    .h-7 { height: 28px !important; }
    .w-2\\.5 { width: 10px !important; }
    .h-2\\.5 { height: 10px !important; }
    .w-24 { width: 96px !important; }
    .w-28 { width: 112px !important; }
    .h-4 { height: 16px !important; }
    .max-w-xs { max-width: 280px !important; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap !important; }
    .overflow-hidden { overflow: hidden !important; }
    .overflow-x-auto { overflow-x: auto !important; }
    table { width: 100%; border-collapse: collapse; }
    .pt-0\\.5 { padding-top: 2px !important; }
    .pt-4 { padding-top: 16px !important; }
    .border-t { border-top: 1px solid #e5e7eb !important; }
    .border-collapse { border-collapse: collapse !important; }
    .w-full { width: 100% !important; }
    .bg-green-500 { background: #22c55e !important; }
    .bg-amber-400 { background: #fbbf24 !important; }
    .bg-red-400 { background: #f87171 !important; }
    @media print {
      body { margin: 0; }
      .bg-hi-navy { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      section { page-break-inside: avoid; }
    }
  </style>
  </head><body>${content}</body></html>`;
}
