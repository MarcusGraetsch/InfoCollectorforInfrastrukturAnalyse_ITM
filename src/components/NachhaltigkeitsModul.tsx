/**
 * Block 7 — EnEfG / CO₂ Nachhaltigkeitsmodul
 */
import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { berechneNachhaltigkeit } from '../sustainability';

interface Props {
  state: AppState;
}

const AUFWAND_COLOR: Record<string, string> = {
  'Niedrig': 'bg-green-100 text-green-800',
  'Mittel':  'bg-amber-100 text-amber-800',
  'Hoch':    'bg-red-100 text-red-800',
};

function KpiBox({ label, value, sub, accent = 'text-hi-accent' }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-bold ${accent} leading-none`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export const NachhaltigkeitsModul: React.FC<Props> = ({ state }) => {
  const summary = useMemo(() => berechneNachhaltigkeit(state), [state]);
  const { profil, enefgPflicht, enefgHinweis, massnahmen } = summary;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Nachhaltigkeit & Energieeffizienz (EnEfG / ESG)</h2>
        <p className="text-sm text-hi-slate">
          Geschätzte CO₂- und Energiebilanz auf Basis der erfassten Infrastruktur.
          Richtwerte: Uptime Institute PUE-Survey 2023, IEA, UBA Emissionsfaktor DE 2023.
        </p>
      </div>

      {/* EnEfG-Banner */}
      <div className={`rounded-xl p-4 border flex items-start gap-3 ${enefgPflicht ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${enefgPflicht ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={enefgPflicht
            ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
        <div>
          <p className={`text-sm font-semibold ${enefgPflicht ? 'text-red-800' : 'text-blue-800'}`}>
            EnEfG-Status: {enefgPflicht ? 'Meldepflichtig (≥ 1 MW IT-Leistung)' : 'Unterhalb Meldeschwelle'}
          </p>
          <p className={`text-xs mt-0.5 ${enefgPflicht ? 'text-red-700' : 'text-blue-700'}`}>{enefgHinweis}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiBox
          label="Server erfasst"
          value={profil.serverCount}
          sub="Grundlage der Schätzung"
        />
        <KpiBox
          label="Energie On-Prem/Jahr"
          value={profil.estimatedKwhJahr.toLocaleString('de-DE')}
          sub="kWh/Jahr (PUE 1,6)"
          accent="text-gray-700"
        />
        <KpiBox
          label="CO₂ On-Prem/Jahr"
          value={profil.estimatedCo2TonnenJahr}
          sub="t CO₂eq/Jahr (DE-Strommix)"
          accent="text-red-700"
        />
        <KpiBox
          label="CO₂-Einsparung Cloud"
          value={`${profil.einsparungProzent}%`}
          sub={`${profil.einsparungCo2Tonnen} t CO₂eq/Jahr`}
          accent="text-green-700"
        />
      </div>

      {/* Vergleich On-Prem vs. Cloud */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-hi-navy mb-4">Energievergleich: On-Premises vs. Cloud</h3>
        <div className="space-y-4">
          {[
            { label: 'On-Premises', kwh: profil.estimatedKwhJahr, co2: profil.estimatedCo2TonnenJahr, color: 'bg-gray-400', textColor: 'text-gray-700' },
            { label: 'Cloud (Hyperscaler)', kwh: profil.cloudKwhJahr, co2: profil.cloudCo2TonnenJahr, color: 'bg-green-500', textColor: 'text-green-700' },
          ].map(row => {
            const pct = profil.estimatedKwhJahr > 0 ? Math.round((row.kwh / profil.estimatedKwhJahr) * 100) : 0;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{row.label}</span>
                  <span className={`text-sm font-bold ${row.textColor}`}>
                    {row.kwh.toLocaleString('de-DE')} kWh · {row.co2} t CO₂eq
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full ${row.color} transition-all`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Schätzung: {profil.serverCount} Server × 4.000 kWh/Jahr × PUE. Quelle: Uptime Institute Global PUE Survey 2023, IEA.
        </p>
      </div>

      {/* Maßnahmen */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">Empfohlene Maßnahmen</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {massnahmen.map((m, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${AUFWAND_COLOR[m.aufwand]}`}>
                  {m.aufwand}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-hi-navy">{m.titel}</p>
                <p className="text-xs text-hi-slate mt-0.5">{m.beschreibung}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-green-700">
                  ~{m.potenzialKwh.toLocaleString('de-DE')} kWh/J.
                </div>
                <div className="text-xs text-gray-400">Einsparpotenzial</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hinweis */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Hinweis zu den Schätzwerten</p>
        <p className="text-xs text-amber-700">
          Alle Werte basieren auf statistischen Richtwerten und der Anzahl der erfassten Server. Für ein
          präzises Energieaudit sind Stromverbrauchsmessungen, PUE-Messungen des Rechenzentrums und
          spezifische Servertypen notwendig. Die Werte dienen als Orientierung für ESG-Reporting und
          Maßnahmenplanung.
        </p>
      </div>
    </div>
  );
};
