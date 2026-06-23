import { useState, useMemo } from 'react';
import type { AppState } from '../types';
import { assessSovereignty } from '../cloudReadiness';
import type { SovereignLevel } from '../cloudReadiness';
import {
  assessSouveraenitaet,
  pruefeSouveraenitaet,
  VERDIKT_FARBE,
  VERDIKT_LABEL,
} from '../compliance/souveraenitaet';
import type { DimensionScore, SouvLevel, Verdikt } from '../compliance/souveraenitaet';

const ASSESSABLE = ['anwendungen', 'server', 'clients', 'icsSysteme', 'iotSysteme'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  icsSysteme: 'ICS-System',
  iotSysteme: 'IoT-System',
};

const LEVEL_COLOR: Record<SouvLevel, string> = {
  Hoch: 'bg-emerald-100 text-emerald-800',
  Mittel: 'bg-amber-100 text-amber-800',
  Niedrig: 'bg-red-100 text-red-800',
};

// SVG Spider / Radar Chart (Muster aus ExecutiveSummary.tsx)
function SouvSpider({ dimensionen }: { dimensionen: DimensionScore[] }) {
  const SIZE = 240;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 88;
  const n = dimensionen.length;
  const grid = [20, 40, 60, 80, 100];

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (value: number, i: number) => {
    const r = (value / 100) * R;
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const gridPolygons = grid.map((g) =>
    dimensionen.map((_, i) => point(g, i)).map((p) => `${p.x},${p.y}`).join(' ')
  );
  const dataPolygon = dimensionen.map((d, i) => point(d.score, i)).map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
      {gridPolygons.map((pts, li) => (
        <polygon key={li} points={pts} fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
      ))}
      {dimensionen.map((d, i) => {
        const p = point(100, i);
        const lp = point(118, i);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#CBD5E1" strokeWidth="0.5" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#64748B" style={{ fontFamily: 'sans-serif' }}>
              {d.label.split(' ')[0].slice(0, 14)}
            </text>
          </g>
        );
      })}
      <polygon points={dataPolygon} fill="#3B82F6" fillOpacity="0.25" stroke="#3B82F6" strokeWidth="1.5" />
      {dimensionen.map((d, i) => {
        const p = point(d.score, i);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />;
      })}
    </svg>
  );
}

interface Props {
  state: AppState;
}

export function SouveraenitaetsBewertung({ state }: Props) {
  const [filterLevel, setFilterLevel] = useState<string>('Alle');
  const [verdiktFilter, setVerdiktFilter] = useState<string>('Alle');

  const scorecard = useMemo(() => assessSouveraenitaet(state), [state]);
  const findings = useMemo(() => pruefeSouveraenitaet(state), [state]);

  const verdiktCounts = useMemo(() => {
    const c: Record<Verdikt, number> = { fail: 0, warn: 0, pass: 0, unklar: 0 };
    findings.forEach((f) => { c[f.verdikt]++; });
    return c;
  }, [findings]);

  const filteredFindings = verdiktFilter === 'Alle' ? findings : findings.filter((f) => f.verdikt === verdiktFilter);

  const rows = ASSESSABLE.flatMap(cat => {
    const items = (state as any)[cat] as any[];
    return items.map(item => {
      const result = assessSovereignty(item);
      return {
        cat,
        id: item.id,
        name: item.name,
        kuerzel: item.kuerzel,
        level: result.level,
        label: result.label,
        anforderung: result.anforderung,
        hinweise: result.hinweise,
      };
    });
  });

  const filtered = filterLevel === 'Alle' ? rows : rows.filter(r => r.level === filterLevel);
  const counts: Record<SovereignLevel, number> = {
    S0: rows.filter(r => r.level === 'S0').length,
    S1: rows.filter(r => r.level === 'S1').length,
    S2: rows.filter(r => r.level === 'S2').length,
    S3: rows.filter(r => r.level === 'S3').length,
  };

  const levelConfig: Record<SovereignLevel, { badge: string; color: string }> = {
    S0: { badge: '⚪ S0 – Kein Bedarf', color: 'bg-gray-100 text-gray-700' },
    S1: { badge: '🔵 S1 – Standard', color: 'bg-blue-100 text-blue-800' },
    S2: { badge: '🟣 S2 – Erhöht (BYOK)', color: 'bg-purple-100 text-purple-800' },
    S3: { badge: '🔴 S3 – Streng souverän', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-hi-navy">Cloud-Souveränität & Compliance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Souveränität ist mehr als Datenresidenz — bewertet über sechs getrennte Dimensionen,
          ergänzt um einen deterministischen Souveränitäts-Washing-Check und die SEAL-Bewertung pro Objekt.
        </p>
      </div>

      {/* ─── Feature A — Mehrdimensionale Scorecard ─── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-hi-navy">Souveränitäts-Scorecard</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-hi-navy">{scorecard.gesamt}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Gesamt-Score</div>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
          <div className="flex justify-center">
            <SouvSpider dimensionen={scorecard.dimensionen} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {scorecard.dimensionen.map((d) => (
              <div key={d.dimension} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-hi-navy">{d.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLOR[d.level]}`}>
                    {d.score} · {d.level}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                  {d.begruendung.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature B — Souveränitäts-Washing-Check ─── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-hi-navy">Souveränitäts-Washing-Check</h3>
          <p className="text-sm text-gray-500 mt-1">
            Deterministische Prüfregeln (kein KI) aus DSGVO, BSI C5, EU AI Act, Data Act u.a.
            Fehlende Nachweise werden als „Unklar" markiert — nicht fälschlich als bestanden.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['Alle', 'fail', 'warn', 'pass', 'unklar'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setVerdiktFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                verdiktFilter === f ? 'bg-hi-navy text-white border-hi-navy' : 'bg-white text-hi-navy border-gray-300 hover:border-hi-navy'
              }`}
            >
              {f === 'Alle' ? `Alle (${findings.length})` : `${VERDIKT_LABEL[f]} (${verdiktCounts[f]})`}
            </button>
          ))}
        </div>

        {findings.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
            Keine Befunde — entweder keine cloud-relevanten Objekte erfasst oder keine Regel ausgelöst.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5 text-left">Objekt</th>
                  <th className="px-3 py-2.5 text-left">Regel</th>
                  <th className="px-3 py-2.5 text-left">Verdikt</th>
                  <th className="px-3 py-2.5 text-left">Begründung</th>
                  <th className="px-3 py-2.5 text-left">Benötigter Nachweis</th>
                  <th className="px-3 py-2.5 text-left">Quelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 align-top">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-hi-navy">{f.objekt}</div>
                      <div className="text-[10px] text-gray-400">{f.kategorie}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{f.regel}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${VERDIKT_FARBE[f.verdikt]}`}>
                        {VERDIKT_LABEL[f.verdikt]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 max-w-sm">{f.begruendung}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 max-w-xs">{f.nachweis}</td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-400 max-w-xs">{f.quelle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── SEAL-Bewertung pro Objekt (bestehend) ─── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-hi-navy">EU-Cloud-Souveränitäts-Bewertung (SEAL)</h3>
          <p className="text-sm text-gray-500 mt-1">
            SEAL-Level-Bewertung (S0–S3) nach Datensouveränität, Verschlüsselungshoheit und Gaia-X-Zertifizierung.
          </p>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['S0', 'S1', 'S2', 'S3'] as const).map(l => (
          <div key={l} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-hi-navy">{counts[l]}</div>
            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${levelConfig[l].color}`}>
              {levelConfig[l].badge}
            </div>
          </div>
        ))}
      </div>

      {/* S2/S3 highlight */}
      {(counts.S2 + counts.S3) > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm text-purple-800 font-medium">
            {counts.S2 + counts.S3} System(e) erfordern erhöhte oder strenge Souveränität (S2/S3) — souveräne Cloud oder On-Premises empfohlen.
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['Alle', 'S0', 'S1', 'S2', 'S3'].map(f => (
          <button
            key={f}
            onClick={() => setFilterLevel(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              filterLevel === f
                ? 'bg-hi-navy text-white border-hi-navy'
                : 'bg-white text-hi-navy border-gray-300 hover:border-hi-navy'
            }`}
          >
            {f === 'Alle' ? `Alle (${rows.length})` : `${f} (${counts[f as SovereignLevel]})`}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-700">
          Noch keine Einträge in den bewerteten Kategorien (Anwendungen, Server, Clients, ICS, IoT).
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Kürzel</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Typ</th>
                <th className="px-4 py-3 text-left">SEAL-Level</th>
                <th className="px-4 py-3 text-left">Anforderung</th>
                <th className="px-4 py-3 text-left">Hinweise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={`${r.cat}-${r.id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.kuerzel}</td>
                  <td className="px-4 py-2.5 font-medium text-hi-navy">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{CATEGORY_LABELS[r.cat] ?? r.cat}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelConfig[r.level].color}`}>
                      {r.level}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs">{r.anforderung}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 max-w-xs">
                    {r.hinweise.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-hi-navy uppercase tracking-wide mb-3">SEAL-Level Erläuterung</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div><span className="font-semibold text-gray-800">S0 – Kein Bedarf:</span> Keine regulatorischen Einschränkungen. Standard Public Cloud ausreichend.</div>
          <div><span className="font-semibold text-gray-800">S1 – Standard:</span> EU/DSGVO-Konformität oder erhöhter Schutzbedarf. EU-Cloud bevorzugt.</div>
          <div><span className="font-semibold text-gray-800">S2 – Erhöht:</span> BYOK/HYOK-Schlüsselverwaltung + Datenspeicherort EU/DE. Managed Private Cloud.</div>
          <div><span className="font-semibold text-gray-800">S3 – Streng:</span> Gaia-X-Zertifizierung oder Confidential Computing. Streng souveräne Cloud / On-Premises.</div>
        </div>
      </div>
      </section>
    </div>
  );
}
