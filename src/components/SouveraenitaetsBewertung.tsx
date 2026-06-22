import { useState } from 'react';
import type { AppState } from '../types';
import { assessSovereignty } from '../cloudReadiness';
import type { SovereignLevel } from '../cloudReadiness';

const ASSESSABLE = ['anwendungen', 'server', 'clients', 'icsSysteme', 'iotSysteme'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  icsSysteme: 'ICS-System',
  iotSysteme: 'IoT-System',
};

interface Props {
  state: AppState;
}

export function SouveraenitaetsBewertung({ state }: Props) {
  const [filterLevel, setFilterLevel] = useState<string>('Alle');

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
        <h2 className="text-xl font-bold text-hi-navy">EU-Cloud-Souveränitäts-Bewertung</h2>
        <p className="text-sm text-gray-500 mt-1">
          SEAL-Level-Bewertung (S0–S3) nach Datensouveränität, Verschlüsselungshoheit und Gaia-X-Zertifizierung.
          Grundlage für die Auswahl geeigneter Cloud-Anbieter und -Modelle gemäß BSI C5 / Gaia-X.
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
    </div>
  );
}
