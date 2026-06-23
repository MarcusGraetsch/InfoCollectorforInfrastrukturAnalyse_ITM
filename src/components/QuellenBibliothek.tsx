import { useState, useMemo } from 'react';
import {
  QUELLEN_REGISTER,
  EBENEN_LABEL,
  ZEITSTRAHL,
} from '../compliance/quellen';
import type { QuellenStatus, QuellenEbene } from '../compliance/quellen';

const STATUS_FARBE: Record<QuellenStatus, string> = {
  gilt: 'bg-emerald-100 text-emerald-800',
  gilt_ab: 'bg-blue-100 text-blue-800',
  in_entwicklung: 'bg-amber-100 text-amber-800',
  entwurf: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<QuellenStatus, string> = {
  gilt: 'gilt',
  gilt_ab: 'gilt ab',
  in_entwicklung: 'in Entwicklung',
  entwurf: 'Entwurf',
};

const EBENEN: QuellenEbene[] = [1, 2, 3, 4, 5];

export function QuellenBibliothek() {
  const [ebeneFilter, setEbeneFilter] = useState<'Alle' | QuellenEbene>('Alle');
  const [statusFilter, setStatusFilter] = useState<'Alle' | QuellenStatus>('Alle');
  const [zeitstrahl, setZeitstrahl] = useState(false);

  const gefiltert = useMemo(
    () =>
      QUELLEN_REGISTER.filter(
        (q) => (ebeneFilter === 'Alle' || q.ebene === ebeneFilter) && (statusFilter === 'Alle' || q.status === statusFilter)
      ),
    [ebeneFilter, statusFilter]
  );

  const sortierterZeitstrahl = useMemo(
    () => [...ZEITSTRAHL].sort((a, b) => a.datum.localeCompare(b.datum)),
    []
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-hi-navy">Compliance-Quellen-Bibliothek</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kuratiertes Offline-Nachschlagewerk zu Cloud-/KI-Compliance über fünf Ebenen.
          </p>
        </div>
        <button
          onClick={() => setZeitstrahl((z) => !z)}
          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            zeitstrahl ? 'bg-hi-navy text-white border-hi-navy' : 'border-gray-300 text-hi-navy hover:border-hi-navy'
          }`}
        >
          {zeitstrahl ? 'Quellen anzeigen' : 'Regulatorik-Zeitstrahl'}
        </button>
      </div>

      <div className="bg-hi-navy/5 border border-hi-navy/10 rounded-lg px-4 py-2.5 text-xs text-hi-navy">
        Statisches Offline-Nachschlagewerk. Stand der Pflege: 2026-06-23. Keine Rechtsberatung.
      </div>

      {zeitstrahl ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-hi-navy mb-5">Regulatorik-Zeitstrahl</h3>
          <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
            {sortierterZeitstrahl.map((e, i) => (
              <li key={i} className="ml-5">
                <span
                  className={`absolute -left-[7px] w-3 h-3 rounded-full border-2 border-white ${
                    e.status === 'gilt' ? 'bg-emerald-500' : e.status === 'gilt_ab' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <time className="text-xs font-mono text-gray-500">{e.datum}</time>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_FARBE[e.status]}`}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
                <div className="text-sm font-medium text-hi-navy">{e.titel}</div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setEbeneFilter('Alle')} className={chip(ebeneFilter === 'Alle')}>Alle Ebenen</button>
              {EBENEN.map((e) => (
                <button key={e} onClick={() => setEbeneFilter(e)} className={chip(ebeneFilter === e)}>{e} · {EBENEN_LABEL[e]}</button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setStatusFilter('Alle')} className={chip(statusFilter === 'Alle')}>Alle Status</button>
              {(['gilt', 'gilt_ab', 'in_entwicklung', 'entwurf'] as QuellenStatus[]).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={chip(statusFilter === s)}>{STATUS_LABEL[s]}</button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gefiltert.map((q) => (
              <div key={q.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-hi-navy">{q.titel}</h4>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_FARBE[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-hi-slate/10 text-hi-slate">{q.bindung}</span>
                  {q.datum && <span className="text-[10px] text-gray-400 font-mono">{q.datum}</span>}
                </div>
                <p className="text-xs text-gray-600 mt-2 flex-1">{q.kurz}</p>
                {q.ablaufHinweis && <p className="text-[11px] text-amber-700 mt-2">⚠ {q.ablaufHinweis}</p>}
                <a
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-hi-accent font-medium mt-3 hover:underline"
                >
                  ↗ öffnen
                </a>
              </div>
            ))}
          </div>
          {gefiltert.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-8">Keine Quellen für diesen Filter.</div>
          )}
        </>
      )}
    </div>
  );
}

function chip(active: boolean): string {
  return `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
    active ? 'bg-hi-navy text-white border-hi-navy' : 'bg-white text-hi-navy border-gray-300 hover:border-hi-navy'
  }`;
}
