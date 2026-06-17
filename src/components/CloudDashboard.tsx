import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { assessAll, summarize } from '../cloudReadiness';
import type { ReadinessLevel } from '../cloudReadiness';

interface Props {
  state: AppState;
  onGoToWizard: () => void;
}

const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  Hoch: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Mittel: 'bg-amber-100 text-amber-800 border border-amber-200',
  Niedrig: 'bg-red-100 text-red-700 border border-red-200',
  Unbewertet: 'bg-gray-100 text-gray-500 border border-gray-200',
};

function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 45) return 'bg-amber-500';
  return 'bg-red-500';
}

const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, accent = 'text-hi-accent', icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider">{label}</div>
      {icon && <div className="text-hi-light opacity-60">{icon}</div>}
    </div>
    <div className={`text-4xl font-bold ${accent} leading-none`}>{value}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

export const CloudDashboard: React.FC<Props> = ({ state, onGoToWizard }) => {
  const items = useMemo(() => assessAll(state), [state]);
  const summary = useMemo(() => summarize(items), [items]);

  const assessed = items.filter((i) => i.result.level !== 'Unbewertet');
  const sorted = [...assessed].sort((a, b) => b.result.score - a.result.score);
  const unassessedCount = summary.unbewertet;

  const dispositionEntries = Object.entries(summary.dispositionCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy">Cloud-Readiness-Auswertung</h2>
          <p className="text-sm text-hi-slate mt-1">
            Grundlage für den Cloud-Readiness-Workshop und die Cloud-Strategie. Bewertet werden
            Anwendungen, Server, Clients sowie ICS-/IoT-Systeme.
          </p>
        </div>
        <button
          onClick={onGoToWizard}
          className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Zum Assistenten
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hi-gray flex items-center justify-center">
            <svg className="w-8 h-8 text-hi-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <p className="text-hi-slate font-medium">Noch keine cloud-relevanten Objekte erfasst.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Starte den Assistenten um Objekte aufzunehmen.</p>
          <button
            onClick={onGoToWizard}
            className="px-5 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors"
          >
            Im Assistenten starten
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Ø Readiness-Score"
              value={summary.avgScore}
              sub={`${summary.bewertet} von ${summary.total} bewertet`}
              accent="text-hi-accent"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <KpiCard
              label="Cloud-ready (Hoch)"
              value={summary.hoch}
              sub="Score ≥ 70"
              accent="text-emerald-600"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KpiCard
              label="Bedingt (Mittel)"
              value={summary.mittel}
              sub="Score 45–69"
              accent="text-amber-600"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <KpiCard
              label="Souveräne Cloud nötig"
              value={summary.souveraen}
              sub="C5 / Gaia-X / DE"
              accent="text-purple-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            />
          </div>

          {unassessedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-amber-800 font-medium">
                  {unassessedCount} Objekt(e) haben noch keine Cloud-Angaben und fließen nicht in die Bewertung ein.
                </span>
              </div>
              <button
                onClick={onGoToWizard}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                Jetzt ergänzen
              </button>
            </div>
          )}

          {/* 6R Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider mb-4">
              Empfohlene Migrationsstrategie (6R)
            </h3>
            <div className="space-y-3">
              {dispositionEntries.map(([disp, count]) => {
                const pct = summary.bewertet ? Math.round((count / summary.bewertet) * 100) : 0;
                return (
                  <div key={disp} className="flex items-center gap-3">
                    <div className="w-44 text-sm text-hi-slate shrink-0 font-medium">{disp}</div>
                    <div className="flex-1 bg-hi-gray rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-hi-accent h-5 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      >
                        <span className="text-[10px] text-white font-bold">{count}</span>
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-hi-slate font-medium">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">
                Bewertung je Objekt — absteigend nach Readiness-Score
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-hi-gray border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Kürzel</th>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Typ</th>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-48">Readiness</th>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Empfehlung (6R)</th>
                    <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Souverän</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((i) => (
                    <tr key={i.id} className="hover:bg-hi-gray/50 align-top transition-colors">
                      <td className="px-4 py-3 font-mono text-hi-accent text-xs whitespace-nowrap font-bold">
                        {i.kuerzel}
                      </td>
                      <td className="px-4 py-3 text-hi-navy font-medium">
                        {i.name}
                        <div className="text-[11px] text-hi-slate mt-0.5 max-w-md font-normal">
                          {i.result.begruendung[0]}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-hi-slate text-xs whitespace-nowrap">
                        {i.categoryLabel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden min-w-[60px]">
                            <div
                              className={`h-2 rounded-full transition-all ${scoreBarColor(i.result.score)}`}
                              style={{ width: `${i.result.score}%` }}
                            />
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${LEVEL_COLOR[i.result.level]}`}>
                            {i.result.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-hi-navy text-xs font-medium">{i.result.empfehlung}</td>
                      <td className="px-4 py-3">
                        {i.result.souveraen ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                            erforderlich
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-hi-slate">
            Hinweis: Die Empfehlungen sind heuristische Vorschläge zur Workshop-Vorbereitung und
            ersetzen keine detaillierte Migrationsanalyse. Die finale 6R-Entscheidung kann je Objekt
            im Feld „Migrationsstrategie (6R)" dokumentiert werden.
          </p>
        </>
      )}
    </div>
  );
};
