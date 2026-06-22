import React, { useMemo } from 'react';
import type { AppState, Anwendung, Schnittstelle } from '../types';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';

interface Props { state: AppState }

/** Kurz-Abkürzung eines Protokolls für die Matrix-Zelle. */
function protoAbbr(p: string): string {
  if (!p) return '✓';
  const map: Record<string, string> = {
    'HTTPS/REST': 'REST', 'gRPC': 'gRPC', 'SOAP': 'SOAP', 'JDBC': 'JDBC',
    'AMQP': 'AMQP', 'Kafka': 'Kafka', 'SFTP': 'SFTP', 'MQTT': 'MQTT',
    'OPC UA': 'OPC', 'GraphQL': 'GQL', 'WebSocket': 'WS',
  };
  return map[p] ?? p.slice(0, 6);
}

function resolve(ref: string, anwendungen: Anwendung[]): Anwendung | undefined {
  return anwendungen.find((a) => a.id === ref || a.kuerzel === ref || a.name === ref);
}

interface Cell { proto: string; verschl: string; richtung: string; name: string; }

export const SchnittstellenMatrix: React.FC<Props> = ({ state }) => {
  const anwendungen = state.anwendungen ?? [];
  const schnittstellen: Schnittstelle[] = state.schnittstellen ?? [];

  // Nur Anwendungen anzeigen, die in mindestens einer Schnittstelle vorkommen.
  const { apps, cells } = useMemo(() => {
    const cellMap = new Map<string, Cell>(); // key: `${quellId}->${zielId}`
    const usedIds = new Set<string>();
    for (const ss of schnittstellen) {
      const q = resolve((ss.quellAnwendung ?? [])[0] ?? '', anwendungen);
      const z = resolve((ss.zielAnwendung ?? [])[0] ?? '', anwendungen);
      if (!q || !z) continue;
      usedIds.add(q.id);
      usedIds.add(z.id);
      cellMap.set(`${q.id}->${z.id}`, {
        proto: ss.protokoll || '', verschl: ss.verschluesselung || '',
        richtung: ss.richtung || '', name: ss.name || ss.kuerzel || '',
      });
      if (ss.richtung === 'Bidirektional') {
        cellMap.set(`${z.id}->${q.id}`, {
          proto: ss.protokoll || '', verschl: ss.verschluesselung || '',
          richtung: ss.richtung || '', name: ss.name || ss.kuerzel || '',
        });
      }
    }
    const filtered = anwendungen.filter((a) => usedIds.has(a.id));
    return { apps: filtered, cells: cellMap };
  }, [anwendungen, schnittstellen]);

  const cellColor = (verschl: string): string => {
    if (verschl === 'Keine') return 'bg-red-100 text-red-800';
    if (verschl === 'Unklar' || verschl === '') return 'bg-amber-100 text-amber-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const handlePrint = () => {
    const headerCells = apps.map((a) => `<th>${esc(a.kuerzel || a.name)}</th>`).join('');
    const rows = apps.map((row) => {
      const tds = apps.map((col) => {
        const c = cells.get(`${row.id}->${col.id}`);
        if (!c) return '<td style="text-align:center;color:#cbd5e1">·</td>';
        const bg = c.verschl === 'Keine' ? '#fee2e2' : (c.verschl === 'Unklar' || !c.verschl) ? '#fef3c7' : '#d1fae5';
        return `<td style="text-align:center;background:${bg}" title="${esc(c.name)} — ${esc(c.proto)} / ${esc(c.verschl || 'Verschl. unklar')}">${esc(protoAbbr(c.proto))}</td>`;
      }).join('');
      return `<tr><th style="text-align:left">${esc(row.kuerzel || row.name)}</th>${tds}</tr>`;
    }).join('');
    const body = `${printHeader('Schnittstellen-Matrix (Data-Flow)', state.customerName)}
      <p style="font-size:11px;color:#666">Zeilen = Quell-Anwendung, Spalten = Ziel-Anwendung. Zelle = Protokoll-Kürzel; Farbe nach Verschlüsselung (grün = verschlüsselt, gelb = unklar, rot = keine).</p>
      <table><thead><tr><th>Quelle ↓ / Ziel →</th>${headerCells}</tr></thead><tbody>${rows}</tbody></table>
      ${printFooter()}`;
    openPrintWindow(`Schnittstellen-Matrix — ${state.customerName || 'Kunde'}`, body,
      'td,th{font-size:10px;padding:4px 6px}');
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Schnittstellen-Matrix (Data-Flow)</h2>
          <p className="text-sm text-gray-500">
            n×n-Übersicht der Kommunikationsbeziehungen · {schnittstellen.length} Schnittstellen, {apps.length} beteiligte Anwendungen
          </p>
        </div>
        <button onClick={handlePrint} disabled={apps.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" /> verschlüsselt</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" /> Verschlüsselung unklar</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" /> keine Verschlüsselung</span>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-hi-navy font-semibold">Noch keine Schnittstellen mit aufgelösten Quell-/Ziel-Anwendungen.</p>
          <p className="text-sm text-hi-slate mt-1">Erfassen Sie Schnittstellen in der Kategorie „Schnittstellen / Kommunikation".</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto shadow-sm">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-hi-gray border border-gray-200 px-2 py-2 font-semibold text-hi-slate text-left whitespace-nowrap">Quelle ↓ / Ziel →</th>
                {apps.map((a) => (
                  <th key={a.id} className="border border-gray-200 px-2 py-2 font-semibold text-hi-slate whitespace-nowrap" title={a.name}>
                    {a.kuerzel || a.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((row) => (
                <tr key={row.id}>
                  <th className="sticky left-0 z-10 bg-hi-gray border border-gray-200 px-2 py-2 font-semibold text-hi-navy text-left whitespace-nowrap" title={row.name}>
                    {row.kuerzel || row.name}
                  </th>
                  {apps.map((col) => {
                    const c = cells.get(`${row.id}->${col.id}`);
                    if (row.id === col.id) {
                      return <td key={col.id} className="border border-gray-200 px-2 py-2 text-center bg-gray-50 text-gray-300">—</td>;
                    }
                    if (!c) {
                      return <td key={col.id} className="border border-gray-200 px-2 py-2 text-center text-gray-300">·</td>;
                    }
                    return (
                      <td
                        key={col.id}
                        className={`border border-gray-200 px-2 py-2 text-center font-semibold cursor-help ${cellColor(c.verschl)}`}
                        title={`${c.name} — ${c.proto || 'Protokoll unklar'} / ${c.verschl || 'Verschlüsselung unklar'}${c.richtung ? ` (${c.richtung})` : ''}`}
                      >
                        {protoAbbr(c.proto)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
