import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { assessAll, summarize } from '../cloudReadiness';
import type { ReadinessLevel } from '../cloudReadiness';

interface Props {
  state: AppState;
  onGoToWizard: () => void;
}

const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  Hoch: 'bg-green-100 text-green-800',
  Mittel: 'bg-yellow-100 text-yellow-800',
  Niedrig: 'bg-red-100 text-red-700',
  Unbewertet: 'bg-gray-100 text-gray-500',
};

function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 45) return 'bg-yellow-500';
  return 'bg-red-500';
}

const KpiCard: React.FC<{ label: string; value: React.ReactNode; sub?: string; accent?: string }> = ({
  label,
  value,
  sub,
  accent = 'text-blue-700',
}) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className={`text-3xl font-bold ${accent} mt-1`}>{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
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
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cloud-Readiness-Auswertung</h2>
          <p className="text-sm text-gray-500 mt-1">
            Grundlage für den Cloud-Readiness-Workshop und die Cloud-Strategie. Bewertet werden
            Anwendungen, Server, Clients sowie ICS-/IoT-Systeme.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          <div className="text-4xl mb-3">☁️</div>
          <p>Noch keine cloud-relevanten Objekte erfasst.</p>
          <button
            onClick={onGoToWizard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
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
            />
            <KpiCard
              label="Cloud-ready (Hoch)"
              value={summary.hoch}
              sub="Score ≥ 70"
              accent="text-green-600"
            />
            <KpiCard
              label="Bedingt (Mittel)"
              value={summary.mittel}
              sub="Score 45–69"
              accent="text-yellow-600"
            />
            <KpiCard
              label="Souveräne Cloud nötig"
              value={summary.souveraen}
              sub="C5 / Gaia-X / DE-Standort"
              accent="text-purple-700"
            />
          </div>

          {unassessedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center justify-between gap-4 flex-wrap">
              <span>
                ⚠️ {unassessedCount} Objekt(e) haben noch keine Cloud-Angaben und fließen nicht in
                die Bewertung ein.
              </span>
              <button
                onClick={onGoToWizard}
                className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700"
              >
                Jetzt ergänzen
              </button>
            </div>
          )}

          {/* Disposition distribution */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Empfohlene Migrationsstrategie (6R)
            </h3>
            <div className="space-y-2">
              {dispositionEntries.map(([disp, count]) => {
                const pct = summary.bewertet ? Math.round((count / summary.bewertet) * 100) : 0;
                return (
                  <div key={disp} className="flex items-center gap-3">
                    <div className="w-48 text-sm text-gray-600 shrink-0">{disp}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      >
                        <span className="text-[10px] text-white font-medium">{count}</span>
                      </div>
                    </div>
                    <div className="w-10 text-right text-xs text-gray-400">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 p-4 pb-2">
              Bewertung je Objekt (absteigend nach Readiness)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Kürzel</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Typ</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600 w-48">Readiness</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Empfehlung (6R)</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Souverän</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((i) => (
                    <tr key={i.id} className="hover:bg-blue-50/50 align-top">
                      <td className="px-4 py-2 font-mono text-blue-700 text-xs whitespace-nowrap">
                        {i.kuerzel}
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        {i.name}
                        <div className="text-[11px] text-gray-400 mt-0.5 max-w-md">
                          {i.result.begruendung[0]}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                        {i.categoryLabel}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden min-w-[60px]">
                            <div
                              className={`h-2 rounded-full ${scoreBarColor(i.result.score)}`}
                              style={{ width: `${i.result.score}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              LEVEL_COLOR[i.result.level]
                            }`}
                          >
                            {i.result.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700 text-xs">{i.result.empfehlung}</td>
                      <td className="px-4 py-2">
                        {i.result.souveraen ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
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

          <p className="text-xs text-gray-400">
            Hinweis: Die Empfehlungen sind heuristische Vorschläge zur Workshop-Vorbereitung und
            ersetzen keine detaillierte Migrationsanalyse. Die finale 6R-Entscheidung kann je Objekt
            im Feld „Migrationsstrategie (6R)" dokumentiert werden.
          </p>
        </>
      )}
    </div>
  );
};
