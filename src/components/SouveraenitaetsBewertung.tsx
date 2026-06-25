import { useState, useMemo } from 'react';
import type { AppState, GovernanceTopic } from '../types';
import { assessSovereignty } from '../cloudReadiness';
import type { SovereignLevel } from '../cloudReadiness';
import {
  assessSouveraenitaet,
  pruefeSouveraenitaet,
  VERDIKT_FARBE,
  VERDIKT_LABEL,
  SOUV_DIMENSION_LABELS,
  souveraenitaetsRisikoMatrix,
} from '../compliance/souveraenitaet';
import type { DimensionScore, SouvLevel, Verdikt, SouvDimension, RisikoSeverity } from '../compliance/souveraenitaet';
import { SOUV_DIMENSION_INFO } from '../compliance/souvDetail';
import { findTopic, makeTopic, upsertTopic } from '../utils/governance';
import { GovernanceTopicDrawer } from './GovernanceTopicDrawer';

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

const SEVERITY_CELL: Record<RisikoSeverity, string> = {
  gering: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-200',
  mittel: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200',
  hoch: 'bg-orange-200 hover:bg-orange-300 text-orange-900 border-orange-300',
  kritisch: 'bg-red-300 hover:bg-red-400 text-red-950 border-red-400',
};
const SEVERITY_LABEL: Record<RisikoSeverity, string> = {
  gering: 'gering', mittel: 'mittel', hoch: 'hoch', kritisch: 'kritisch',
};
const SEAL_BEDARF_LABEL: Record<string, string> = {
  S3: 'S3 · Streng souverän', S2: 'S2 · Erhöht (BYOK)', S1: 'S1 · Standard (EU)', S0: 'S0 · Kein Bedarf',
};
const SOUV_CAT_LABEL: Record<string, string> = {
  anwendungen: 'Anwendung', server: 'Server', clients: 'Client', icsSysteme: 'ICS', iotSysteme: 'IoT',
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
  onUpdateTopics: (topics: GovernanceTopic[]) => void;
}

export function SouveraenitaetsBewertung({ state, onUpdateTopics }: Props) {
  const [filterLevel, setFilterLevel] = useState<string>('Alle');
  const [verdiktFilter, setVerdiktFilter] = useState<string>('Alle');
  const [openDim, setOpenDim] = useState<SouvDimension | null>(null);

  const topics = state.governanceTopics ?? [];
  const STATUS_BADGE: Record<string, string> = {
    'Offen': 'bg-gray-100 text-gray-500',
    'In Arbeit': 'bg-sky-100 text-sky-700',
    'Teilweise': 'bg-amber-100 text-amber-700',
    'Erfüllt': 'bg-emerald-100 text-emerald-700',
    'N/A': 'bg-gray-100 text-gray-400',
  };
  const topicFor = (dim: SouvDimension) => findTopic(topics, 'cloudSovereignty', dim);
  const openTopic = openDim ? (topicFor(openDim) ?? makeTopic('cloudSovereignty', openDim, SOUV_DIMENSION_LABELS[openDim])) : null;
  const patchTopic = (changes: Partial<GovernanceTopic>) => {
    if (!openDim || !openTopic) return;
    onUpdateTopics(upsertTopic(topics, { ...openTopic, ...changes }));
  };

  const scorecard = useMemo(() => assessSouveraenitaet(state), [state]);
  const findings = useMemo(() => pruefeSouveraenitaet(state), [state]);
  const risikoMatrix = useMemo(() => souveraenitaetsRisikoMatrix(state), [state]);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const selectedZelle = risikoMatrix.zellen.find(z => `${z.seal}-${z.risiko}` === selectedCell) ?? null;

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
            {scorecard.dimensionen.map((d) => {
              const t = topicFor(d.dimension as SouvDimension);
              return (
                <button
                  key={d.dimension}
                  onClick={() => setOpenDim(d.dimension as SouvDimension)}
                  className="text-left border border-gray-100 rounded-lg p-3 bg-gray-50/50 hover:border-hi-accent/50 hover:bg-hi-accent/5 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-hi-navy group-hover:text-hi-accent transition-colors flex items-center gap-1">
                      {d.label}
                      <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-hi-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLOR[d.level]}`}>
                      {d.score} · {d.level}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                    {d.begruendung.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-hi-accent font-medium">Governance-Wizard öffnen</span>
                    {t?.status && t.status !== 'Offen' && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? ''}`}>{t.status}</span>}
                    {t?.maturity !== undefined && <span className="text-[10px] text-gray-400">Reifegrad {t.maturity}/4</span>}
                    {(t?.relatedEvidenceIds?.length ?? 0) > 0 && <span className="text-[10px] text-emerald-600">{t!.relatedEvidenceIds!.length} Nachweis(e)</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Souveränitäts-Risiko-Matrix ─── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-hi-navy">Souveränitäts-Risiko-Matrix</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Bedarf × Exposition je Objekt — deterministisch aus den Cloud-Feldern abgeleitet.
              <strong> Zeilen:</strong> Souveränitätsbedarf (SEAL S0–S3). <strong> Spalten:</strong> Ist-Risiko
              (Jurisdiktion, Schlüsselhoheit, Portabilität, Bereitstellung, Gaia-X). Kritisch wird es nur dort,
              wo hoher Bedarf auf hohe Exposition trifft. Klick auf eine Zelle zeigt die Objekte.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full font-semibold">{risikoMatrix.kritisch} kritisch</span>
            <span className="text-xs px-3 py-1.5 bg-orange-100 text-orange-800 border border-orange-200 rounded-full font-semibold">{risikoMatrix.handlungsbedarf} Handlungsbedarf</span>
            <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-full font-medium">{risikoMatrix.datenarm} ohne Cloud-Daten</span>
          </div>
        </div>

        {risikoMatrix.gesamt === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Keine bewertbaren Objekte (Anwendungen/Server/Clients/ICS/IoT) erfasst.</p>
        ) : (
          <>
            <div className="flex gap-3">
              {/* Y-Achsen-Beschriftung */}
              <div className="flex items-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Souveränitätsbedarf →</span>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
                  <thead>
                    <tr>
                      <th className="w-28" />
                      {(['Niedrig', 'Mittel', 'Hoch'] as const).map(r => (
                        <th key={r} className="text-center text-[11px] font-semibold text-gray-500 pb-1">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['S3', 'S2', 'S1', 'S0'] as const).map(seal => (
                      <tr key={seal}>
                        <td className="pr-2 text-right align-middle">
                          <span className="text-[11px] font-semibold text-hi-navy whitespace-nowrap">{SEAL_BEDARF_LABEL[seal]}</span>
                        </td>
                        {(['Niedrig', 'Mittel', 'Hoch'] as const).map(risiko => {
                          const z = risikoMatrix.zellen.find(c => c.seal === seal && c.risiko === risiko)!;
                          const key = `${seal}-${risiko}`;
                          const active = selectedCell === key;
                          return (
                            <td key={risiko} className="p-0">
                              <button
                                onClick={() => setSelectedCell(active ? null : (z.count > 0 ? key : null))}
                                disabled={z.count === 0}
                                title={`Bedarf ${seal} · Risiko ${risiko} · ${SEVERITY_LABEL[z.severity]}`}
                                className={`w-full h-16 rounded-lg border flex flex-col items-center justify-center transition-colors ${SEVERITY_CELL[z.severity]} ${z.count === 0 ? 'opacity-40 cursor-default' : 'cursor-pointer'} ${active ? 'ring-2 ring-hi-navy' : ''}`}
                              >
                                <span className="text-xl font-bold leading-none">{z.count}</span>
                                <span className="text-[9px] uppercase tracking-wide mt-0.5">{SEVERITY_LABEL[z.severity]}</span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Ist-Risiko / Exposition →</p>
              </div>
            </div>

            {/* Legende */}
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              {(['gering', 'mittel', 'hoch', 'kritisch'] as const).map(sev => (
                <span key={sev} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${SEVERITY_CELL[sev].split(' ')[0]}`} />{SEVERITY_LABEL[sev]}
                </span>
              ))}
            </div>

            {/* Drilldown der gewählten Zelle */}
            {selectedZelle && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-hi-navy">
                    Bedarf {SEAL_BEDARF_LABEL[selectedZelle.seal]} · Risiko {selectedZelle.risiko}
                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_CELL[selectedZelle.severity]}`}>{SEVERITY_LABEL[selectedZelle.severity]}</span>
                  </span>
                  <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-gray-700 text-sm">×</button>
                </div>
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {selectedZelle.objekte.map(o => (
                    <div key={`${o.kategorie}-${o.id}`} className="px-4 py-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-hi-navy text-sm">{o.name}</span>
                        <span className="text-[10px] font-mono text-gray-400">{o.kuerzel}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{SOUV_CAT_LABEL[o.kategorie] ?? o.kategorie}</span>
                        <span className="text-[10px] text-gray-400">Exposition {o.risikoScore}/100</span>
                        {o.datenarm && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Cloud-Daten fehlen</span>}
                      </div>
                      {o.treiber.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {o.treiber.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-500">{t}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400">
              Schätzung aus erfassten Cloud-Souveränitätsfeldern — keine rechtsverbindliche Bewertung.
              Objekte „ohne Cloud-Daten" werden konservativ mit Unklar-Risiko geführt; im Governance-Wizard
              je Dimension lassen sich Maßnahmen und Nachweise hinterlegen.
            </p>
          </>
        )}
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

      {openDim && openTopic && (() => {
        const d = scorecard.dimensionen.find(x => x.dimension === openDim);
        return (
          <GovernanceTopicDrawer
            title={SOUV_DIMENSION_LABELS[openDim]}
            subtitle="Cloud-Souveränität — Governance-Wizard"
            info={SOUV_DIMENSION_INFO[openDim]}
            topic={openTopic}
            roles={state.roleAssignments ?? []}
            evidence={state.evidenceItems ?? []}
            liveScore={d ? { score: d.score, level: d.level, begruendung: d.begruendung } : undefined}
            onPatch={patchTopic}
            onClose={() => setOpenDim(null)}
          />
        );
      })()}
    </div>
  );
}
